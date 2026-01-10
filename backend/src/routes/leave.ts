import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Get leave balance
router.get('/balance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { annualLeave: true, usedLeave: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      total: user.annualLeave,
      used: user.usedLeave,
      remaining: user.annualLeave - user.usedLeave
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// Request leave
router.post(
  '/request',
  authenticate,
  [
    body('type').isIn(['ANNUAL', 'HALF_AM', 'HALF_PM', 'SICK', 'SPECIAL', 'UNPAID']),
    body('startDate').isISO8601(),
    body('endDate').isISO8601()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, startDate, endDate, reason } = req.body;

    try {
      // Calculate days
      const start = new Date(startDate);
      const end = new Date(endDate);
      let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Half day
      if (type === 'HALF_AM' || type === 'HALF_PM') {
        days = 0.5;
      }

      // Check remaining leave
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (type === 'ANNUAL' || type === 'HALF_AM' || type === 'HALF_PM') {
        const remaining = user.annualLeave - user.usedLeave;
        if (days > remaining) {
          return res.status(400).json({
            error: 'Insufficient leave balance',
            remaining
          });
        }
      }

      const leaveRequest = await prisma.leaveRequest.create({
        data: {
          userId: req.user!.id,
          type,
          startDate: start,
          endDate: end,
          days,
          reason
        }
      });

      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error('Leave request error:', error);
      res.status(500).json({ error: 'Failed to create leave request' });
    }
  }
);

// Get my leave requests
router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response) => {
  const { status, year } = req.query;

  try {
    const where: any = { userId: req.user!.id };

    if (status) {
      where.status = status;
    }

    if (year) {
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.startDate = {
        gte: startOfYear,
        lte: endOfYear
      };
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// Cancel leave request
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const request = await prisma.leaveRequest.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'PENDING'
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found or cannot be cancelled' });
    }

    await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Leave request cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
});

// [Admin] Get pending requests
router.get(
  '/pending',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const requests = await prisma.leaveRequest.findMany({
        where: {
          status: 'PENDING',
          user: { companyId: req.user!.companyId }
        },
        include: {
          user: {
            select: { name: true, email: true, department: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
  }
);

// [Admin] Approve/Reject leave
router.put(
  '/:id/decision',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  [body('decision').isIn(['APPROVED', 'REJECTED'])],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { decision, rejectReason } = req.body;

    try {
      const request = await prisma.leaveRequest.findFirst({
        where: { id, status: 'PENDING' }
      });

      if (!request) {
        return res.status(404).json({ error: 'Leave request not found' });
      }

      await prisma.$transaction(async (tx) => {
        // Update leave request
        await tx.leaveRequest.update({
          where: { id },
          data: {
            status: decision,
            approverId: req.user!.id,
            approvedAt: new Date(),
            rejectReason: decision === 'REJECTED' ? rejectReason : null
          }
        });

        // If approved, deduct leave
        if (decision === 'APPROVED' && ['ANNUAL', 'HALF_AM', 'HALF_PM'].includes(request.type)) {
          await tx.user.update({
            where: { id: request.userId },
            data: {
              usedLeave: { increment: request.days }
            }
          });
        }
      });

      res.json({ message: `Leave request ${decision.toLowerCase()}` });
    } catch (error) {
      console.error('Decision error:', error);
      res.status(500).json({ error: 'Failed to process decision' });
    }
  }
);

export default router;
