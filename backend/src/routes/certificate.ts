import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// Request certificate
router.post(
  '/request',
  authenticate,
  [
    body('type').isIn(['EMPLOYMENT', 'CAREER', 'INCOME']),
    body('purpose').optional().isString()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, purpose } = req.body;

    try {
      const certificate = await prisma.certificate.create({
        data: {
          userId: req.user!.id,
          type,
          purpose
        }
      });

      res.status(201).json({
        message: '증명서 신청이 완료되었습니다.',
        certificate
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to request certificate' });
    }
  }
);

// Get my certificates
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Download certificate (returns file path or generates PDF)
router.get('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const certificate = await prisma.certificate.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'ISSUED'
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found or not issued yet' });
    }

    if (!certificate.filePath) {
      return res.status(400).json({ error: 'Certificate file not available' });
    }

    // In production, return signed URL or stream file
    res.json({
      downloadUrl: certificate.filePath,
      expiresIn: 3600
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// [Admin] Get pending certificates
router.get(
  '/pending',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    try {
      const certificates = await prisma.certificate.findMany({
        where: {
          status: 'PENDING',
          user: { companyId: req.user!.companyId }
        },
        include: {
          user: {
            select: { name: true, email: true, employeeNo: true, hireDate: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json(certificates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending certificates' });
    }
  }
);

// [Admin] Issue certificate
router.put(
  '/:id/issue',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { filePath } = req.body;

    try {
      const certificate = await prisma.certificate.findFirst({
        where: { id, status: 'PENDING' }
      });

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }

      // In production, generate PDF here and upload to storage
      const updated = await prisma.certificate.update({
        where: { id },
        data: {
          status: 'ISSUED',
          filePath: filePath || `certificates/${id}.pdf`,
          issuedAt: new Date()
        }
      });

      res.json({
        message: '증명서가 발급되었습니다.',
        certificate: updated
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to issue certificate' });
    }
  }
);

// [Admin] Reject certificate
router.put(
  '/:id/reject',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
      await prisma.certificate.update({
        where: { id },
        data: { status: 'REJECTED' }
      });

      res.json({ message: '증명서 신청이 반려되었습니다.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject certificate' });
    }
  }
);

export default router;
