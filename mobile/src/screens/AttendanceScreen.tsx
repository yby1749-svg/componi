import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, WorkHoursGauge } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { Attendance, WeeklyHours } from '../types';

// 데모 근태 기록 생성
const generateDemoAttendances = (): Attendance[] => {
  const attendances: Attendance[] = [];
  const today = new Date();

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // 주말 제외
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const checkIn = new Date(date);
    checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 30), 0);

    const checkOut = new Date(date);
    checkOut.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0);

    const workMinutes = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60));

    let status: Attendance['status'] = 'NORMAL';
    if (checkIn.getHours() >= 10) status = 'LATE';
    if (i === 5) status = 'HALF_LEAVE';

    attendances.push({
      id: `att-${i}`,
      date: date.toISOString(),
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      workMinutes,
      overtimeMin: Math.max(0, workMinutes - 480),
      status,
    });
  }

  return attendances;
};

const DEMO_WEEKLY_HOURS: WeeklyHours = {
  weekStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  weekEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  totalHours: 32.5,
  remainingHours: 19.5,
  isOverLimit: false,
  dailyRecords: [],
};

export const AttendanceScreen: React.FC = () => {
  const { token, user } = useAuthStore();
  const isDemo = token === 'demo-token-12345' || user?.id === 'demo-user-001';

  const [refreshing, setRefreshing] = useState(false);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  // 데모 모드 초기화
  useEffect(() => {
    if (isDemo) {
      setWeeklyHours(DEMO_WEEKLY_HOURS);
      setAttendances(generateDemoAttendances());
    }
  }, [isDemo]);

  const fetchData = useCallback(async () => {
    if (isDemo) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [weeklyRes, historyRes] = await Promise.all([
        api.get(API_ENDPOINTS.WEEKLY_HOURS),
        api.get(API_ENDPOINTS.ATTENDANCE_HISTORY, {
          params: {
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
          },
        }),
      ]);

      setWeeklyHours(weeklyRes.data);
      setAttendances(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  }, [isDemo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
      NORMAL: { label: '정상', color: colors.success, bg: colors.successLight },
      LATE: { label: '지각', color: colors.warning, bg: colors.warningLight },
      EARLY_LEAVE: { label: '조퇴', color: colors.warning, bg: colors.warningLight },
      ABSENT: { label: '결근', color: colors.error, bg: colors.errorLight },
      LEAVE: { label: '휴가', color: colors.info, bg: colors.infoLight },
      HALF_LEAVE: { label: '반차', color: colors.info, bg: colors.infoLight },
    };
    return statusMap[status] || { label: status, color: colors.textSecondary, bg: colors.surfaceSecondary };
  };

  const renderAttendanceItem = ({ item }: { item: Attendance }) => {
    const status = getStatusBadge(item.status);
    const workHours = item.workMinutes ? Math.floor(item.workMinutes / 60) : 0;
    const workMins = item.workMinutes ? item.workMinutes % 60 : 0;

    return (
      <View style={styles.attendanceItem}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>출근</Text>
            <Text style={styles.timeValue}>{formatTime(item.checkIn)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>퇴근</Text>
            <Text style={styles.timeValue}>{formatTime(item.checkOut)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>근무</Text>
            <Text style={styles.timeValue}>
              {item.workMinutes ? `${workHours}h ${workMins}m` : '-'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>근태 관리</Text>
      </View>

      <FlatList
        data={attendances}
        renderItem={renderAttendanceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Card style={styles.weeklyCard}>
            <WorkHoursGauge
              currentHours={weeklyHours?.totalHours || 0}
              maxHours={52}
              label="이번 주 근무시간"
            />
          </Card>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>근태 기록이 없습니다.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
  },
  weeklyCard: {
    marginBottom: spacing.md,
  },
  attendanceItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dateText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  timeContainer: {
    flexDirection: 'row',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
