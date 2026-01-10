import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { isWithinRadius } from '../utils/geo';

const router = Router();
const prisma = new PrismaClient();

// Check-in
router.post('/check-in', authenticate, async (req: AuthRequest, res: Response) => {
  const { latitude, longitude, workplaceId } = req.body;

  try {
    // Validate workplace and GPS
    const workplace = await prisma.workplace.findFirst({
      where: {
        id: workplaceId,
        companyId: req.user!.companyId,
        isActive: true
      }
    });

    if (!workplace) {
      return res.status(400).json({ error: 'Invalid workplace' });
    }

    const isInRange = isWithinRadius(
      latitude,
      longitude,
      workplace.latitude,
      workplace.longitude,
      workplace.radius
    );

    if (!isInRange) {
      return res.status(400).json({
        error: 'Out of range',
        message: '근무지 범위를 벗어났습니다.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check existing attendance
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: today
        }
      }
    });

    if (existing?.checkIn) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    const now = new Date();
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: today
        }
      },
      update: {
        checkIn: now,
        checkInLat: latitude,
        checkInLng: longitude,
        workplaceId
      },
      create: {
        userId: req.user!.id,
        date: today,
        checkIn: now,
        checkInLat: latitude,
        checkInLng: longitude,
        workplaceId
      }
    });

    res.json({
      message: '출근이 완료되었습니다.',
      attendance
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Check-out
router.post('/check-out', authenticate, async (req: AuthRequest, res: Response) => {
  const { latitude, longitude } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: today
        }
      }
    });

    if (!attendance?.checkIn) {
      return res.status(400).json({ error: 'No check-in record found' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    const now = new Date();
    const workMinutes = Math.floor(
      (now.getTime() - attendance.checkIn.getTime()) / (1000 * 60)
    );

    // Calculate overtime (over 8 hours = 480 minutes)
    const overtimeMin = Math.max(0, workMinutes - 480);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: now,
        checkOutLat: latitude,
        checkOutLng: longitude,
        workMinutes,
        overtimeMin
      }
    });

    res.json({
      message: '퇴근이 완료되었습니다.',
      attendance: updated,
      workHours: Math.floor(workMinutes / 60),
      workMinutesRemainder: workMinutes % 60
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// Get today's attendance
router.get('/today', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: req.user!.id,
          date: today
        }
      },
      include: { workplace: true }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance history
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  try {
    const where: any = { userId: req.user!.id };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { workplace: true }
    });

    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// Get weekly work hours (for 52-hour tracking)
router.get('/weekly-hours', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        userId: req.user!.id,
        date: {
          gte: monday,
          lte: sunday
        }
      }
    });

    const totalMinutes = attendances.reduce((sum, a) => sum + (a.workMinutes || 0), 0);
    const totalHours = totalMinutes / 60;
    const remainingHours = Math.max(0, 52 - totalHours);

    res.json({
      weekStart: monday,
      weekEnd: sunday,
      totalHours: Math.round(totalHours * 10) / 10,
      remainingHours: Math.round(remainingHours * 10) / 10,
      isOverLimit: totalHours > 52,
      dailyRecords: attendances
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate weekly hours' });
  }
});

export default router;
