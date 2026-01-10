import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// 2024년 기준 4대보험 요율 (근로자 부담분)
const INSURANCE_RATES = {
  nationalPension: 0.045,      // 국민연금 4.5%
  healthInsurance: 0.03545,    // 건강보험 3.545%
  longTermCare: 0.1295,        // 장기요양보험 (건강보험의 12.95%)
  employmentInsurance: 0.009   // 고용보험 0.9%
};

// 간이세액표 기반 소득세 계산 (간략화)
function calculateIncomeTax(monthlyIncome: number): number {
  if (monthlyIncome <= 1060000) return 0;
  if (monthlyIncome <= 1500000) return Math.floor((monthlyIncome - 1060000) * 0.06);
  if (monthlyIncome <= 3000000) return Math.floor(26400 + (monthlyIncome - 1500000) * 0.15);
  if (monthlyIncome <= 4500000) return Math.floor(251400 + (monthlyIncome - 3000000) * 0.24);
  return Math.floor(611400 + (monthlyIncome - 4500000) * 0.35);
}

// Get my payroll history
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  const { year } = req.query;

  try {
    const where: any = { userId: req.user!.id };

    if (year) {
      where.year = parseInt(year as string);
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll history' });
  }
});

// Get specific month payroll
router.get('/my/:year/:month', authenticate, async (req: AuthRequest, res: Response) => {
  const { year, month } = req.params;

  try {
    const payroll = await prisma.payroll.findUnique({
      where: {
        userId_year_month: {
          userId: req.user!.id,
          year: parseInt(year),
          month: parseInt(month)
        }
      }
    });

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
});

// [Admin] Generate monthly payroll
router.post(
  '/generate',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const { year, month } = req.body;

    try {
      const users = await prisma.user.findMany({
        where: {
          companyId: req.user!.companyId,
          status: 'ACTIVE'
        }
      });

      const results = [];

      for (const user of users) {
        // Get attendance data for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const attendances = await prisma.attendance.findMany({
          where: {
            userId: user.id,
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const totalOvertimeMinutes = attendances.reduce(
          (sum, a) => sum + (a.overtimeMin || 0),
          0
        );

        // Calculate pay
        const baseSalary = user.baseSalary;
        const hourlyRate = Math.floor(baseSalary / 209); // 월 소정근로시간 209시간
        const overtimePay = Math.floor(hourlyRate * 1.5 * (totalOvertimeMinutes / 60));
        const totalAllowance = overtimePay;
        const grossPay = baseSalary + totalAllowance;

        // Calculate deductions
        const nationalPension = Math.floor(grossPay * INSURANCE_RATES.nationalPension);
        const healthInsurance = Math.floor(grossPay * INSURANCE_RATES.healthInsurance);
        const longTermCare = Math.floor(healthInsurance * INSURANCE_RATES.longTermCare);
        const employmentIns = Math.floor(grossPay * INSURANCE_RATES.employmentInsurance);
        const incomeTax = calculateIncomeTax(grossPay);
        const localIncomeTax = Math.floor(incomeTax * 0.1);

        const totalDeduction =
          nationalPension +
          healthInsurance +
          longTermCare +
          employmentIns +
          incomeTax +
          localIncomeTax;

        const netPay = grossPay - totalDeduction;

        // Upsert payroll record
        const payroll = await prisma.payroll.upsert({
          where: {
            userId_year_month: {
              userId: user.id,
              year,
              month
            }
          },
          update: {
            baseSalary,
            overtimePay,
            totalAllowance,
            nationalPension,
            healthInsurance,
            longTermCare,
            employmentIns,
            incomeTax,
            localIncomeTax,
            totalDeduction,
            netPay
          },
          create: {
            companyId: req.user!.companyId,
            userId: user.id,
            year,
            month,
            baseSalary,
            overtimePay,
            totalAllowance,
            nationalPension,
            healthInsurance,
            longTermCare,
            employmentIns,
            incomeTax,
            localIncomeTax,
            totalDeduction,
            netPay
          }
        });

        results.push(payroll);
      }

      res.json({
        message: `${year}년 ${month}월 급여 생성 완료`,
        count: results.length,
        payrolls: results
      });
    } catch (error) {
      console.error('Generate payroll error:', error);
      res.status(500).json({ error: 'Failed to generate payroll' });
    }
  }
);

// [Admin] Get all payrolls
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const { year, month } = req.query;

    try {
      const where: any = { companyId: req.user!.companyId };

      if (year) where.year = parseInt(year as string);
      if (month) where.month = parseInt(month as string);

      const payrolls = await prisma.payroll.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, department: true }
          }
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }]
      });

      res.json(payrolls);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
  }
);

export default router;
