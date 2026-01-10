import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Get my contracts
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        signatures: {
          select: { signedAt: true }
        }
      }
    });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Get pending contracts
router.get('/pending', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contracts = await prisma.contract.findMany({
      where: {
        userId: req.user!.id,
        status: 'PENDING'
      },
      orderBy: { sentAt: 'desc' }
    });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending contracts' });
  }
});

// Get contract detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user!.id },
          { companyId: req.user!.companyId }
        ]
      },
      include: {
        signatures: true,
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Sign contract
router.post('/:id/sign', authenticate, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { signatureImage, deviceInfo } = req.body;

  if (!signatureImage) {
    return res.status(400).json({ error: 'Signature image is required' });
  }

  try {
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        userId: req.user!.id,
        status: 'PENDING'
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found or already signed' });
    }

    // Create hash of signature for integrity verification
    const imageHash = crypto
      .createHash('sha256')
      .update(signatureImage)
      .digest('hex');

    // Save signature image (in production, save to S3/storage)
    const imagePath = `signatures/${req.user!.id}/${id}_${Date.now()}.png`;

    await prisma.$transaction(async (tx) => {
      // Create signature record
      await tx.signature.create({
        data: {
          contractId: id,
          userId: req.user!.id,
          imagePath,
          imageHash,
          ipAddress: req.ip,
          deviceInfo
        }
      });

      // Update contract status
      await tx.contract.update({
        where: { id },
        data: {
          status: 'SIGNED',
          signedAt: new Date()
        }
      });
    });

    res.json({
      message: '계약서 서명이 완료되었습니다.',
      signedAt: new Date()
    });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ error: 'Failed to sign contract' });
  }
});

// [Admin] Create contract
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const { userId, type, title, content, expiresAt } = req.body;

    try {
      const contract = await prisma.contract.create({
        data: {
          companyId: req.user!.companyId,
          userId,
          type,
          title,
          content,
          status: 'PENDING',
          sentAt: new Date(),
          expiresAt: expiresAt ? new Date(expiresAt) : undefined
        }
      });

      res.status(201).json(contract);
    } catch (error) {
      console.error('Create contract error:', error);
      res.status(500).json({ error: 'Failed to create contract' });
    }
  }
);

// [Admin] Get all contracts
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthRequest, res: Response) => {
    const { status, userId } = req.query;

    try {
      const where: any = { companyId: req.user!.companyId };

      if (status) where.status = status;
      if (userId) where.userId = userId;

      const contracts = await prisma.contract.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true }
          },
          signatures: {
            select: { signedAt: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  }
);

export default router;
