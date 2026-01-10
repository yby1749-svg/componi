import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        company: true,
        department: true,
        position: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  const { phone } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { phone }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// [Admin] Get all users
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const { departmentId, status } = req.query;

    try {
      const where: any = { companyId: req.user!.companyId };

      if (departmentId) where.departmentId = departmentId;
      if (status) where.status = status;

      const users = await prisma.user.findMany({
        where,
        include: {
          department: true,
          position: true
        },
        orderBy: { name: 'asc' }
      });

      const usersWithoutPassword = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// [Admin] Get user detail
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
      const user = await prisma.user.findFirst({
        where: {
          id,
          companyId: req.user!.companyId
        },
        include: {
          company: true,
          department: true,
          position: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
);

// [Admin] Update user
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { departmentId, positionId, role, status, annualLeave, baseSalary } = req.body;

    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          departmentId,
          positionId,
          role,
          status,
          annualLeave,
          baseSalary
        }
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Get workplaces for check-in
router.get('/workplaces', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const workplaces = await prisma.workplace.findMany({
      where: {
        companyId: req.user!.companyId,
        isActive: true
      }
    });

    res.json(workplaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workplaces' });
  }
});

export default router;
