import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Card, CheckInButton, WorkHoursGauge } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { Attendance, WeeklyHours, Workplace } from '../types';

// 데모 데이터
const DEMO_ATTENDANCE: Attendance = {
  id: 'att-001',
  date: new Date().toISOString(),
  checkIn: new Date(new Date().setHours(9, 2, 0)).toISOString(),
  checkOut: undefined,
  workMinutes: 0,
  overtimeMin: 0,
  status: 'NORMAL',
};

const DEMO_WEEKLY_HOURS: WeeklyHours = {
  weekStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  weekEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
  totalHours: 32.5,
  remainingHours: 19.5,
  isOverLimit: false,
  dailyRecords: [],
};

const DEMO_WORKPLACES: Workplace[] = [
  {
    id: 'wp-001',
    name: '본사',
    latitude: 37.5665,
    longitude: 126.978,
    radius: 100,
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isDemo = token === 'demo-token-12345' || user?.id === 'demo-user-001';

  const [refreshing, setRefreshing] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  // 데모 모드 초기화
  useEffect(() => {
    if (isDemo) {
      setTodayAttendance(DEMO_ATTENDANCE);
      setWeeklyHours(DEMO_WEEKLY_HOURS);
      setWorkplaces(DEMO_WORKPLACES);
    }
  }, [isDemo]);

  const fetchData = useCallback(async () => {
    if (isDemo) {
      // 데모 모드에서는 API 호출 안함
      return;
    }
    try {
      const [attendanceRes, weeklyRes, workplacesRes] = await Promise.all([
        api.get(API_ENDPOINTS.ATTENDANCE_TODAY),
        api.get(API_ENDPOINTS.WEEKLY_HOURS),
        api.get(API_ENDPOINTS.WORKPLACES),
      ]);

      setTodayAttendance(attendanceRes.data);
      setWeeklyHours(weeklyRes.data);
      setWorkplaces(workplacesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [isDemo]);

  useEffect(() => {
    fetchData();

    // Update current time every second
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCheckInOut = async () => {
    const isCheckingIn = !todayAttendance?.checkIn || !!todayAttendance?.checkOut;

    setCheckInLoading(true);

    // 데모 모드
    if (isDemo) {
      setTimeout(() => {
        if (isCheckingIn) {
          const now = new Date();
          setTodayAttendance({
            ...DEMO_ATTENDANCE,
            checkIn: now.toISOString(),
            checkOut: undefined,
          });
          Alert.alert('출근 완료', `${now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 출근했습니다.`);
        } else {
          const now = new Date();
          const checkInTime = new Date(todayAttendance!.checkIn!);
          const workMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60));
          setTodayAttendance({
            ...todayAttendance!,
            checkOut: now.toISOString(),
            workMinutes,
          });
          Alert.alert('퇴근 완료', `오늘 근무시간: ${Math.floor(workMinutes / 60)}시간 ${workMinutes % 60}분`);
        }
        setCheckInLoading(false);
      }, 500);
      return;
    }

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한 필요', '출퇴근 체크를 위해 위치 권한이 필요합니다.');
      setCheckInLoading(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      if (isCheckingIn) {
        if (workplaces.length === 0) {
          Alert.alert('오류', '등록된 근무지가 없습니다. 관리자에게 문의하세요.');
          setCheckInLoading(false);
          return;
        }

        const workplace = workplaces[0];
        const response = await api.post(API_ENDPOINTS.CHECK_IN, {
          latitude,
          longitude,
          workplaceId: workplace.id,
        });

        Alert.alert('출근 완료', response.data.message);
      } else {
        const response = await api.post(API_ENDPOINTS.CHECK_OUT, {
          latitude,
          longitude,
        });

        const { workHours, workMinutesRemainder } = response.data;
        Alert.alert('퇴근 완료', `오늘 근무시간: ${workHours}시간 ${workMinutesRemainder}분`);
      }

      await fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || '처리에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setCheckInLoading(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '--:--';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요,</Text>
            <Text style={styles.userName}>{user?.name}님</Text>
          </View>
          <Text style={styles.currentTime}>{currentTime}</Text>
        </View>

        {/* Check-in/out Button */}
        <Card style={styles.checkInCard} variant="elevated">
          <CheckInButton
            isCheckedIn={isCheckedIn}
            onPress={handleCheckInOut}
            loading={checkInLoading}
            currentTime={currentTime}
          />

          <View style={styles.todayRecord}>
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>출근</Text>
              <Text style={styles.recordValue}>
                {formatTime(todayAttendance?.checkIn)}
              </Text>
            </View>
            <View style={styles.recordDivider} />
            <View style={styles.recordItem}>
              <Text style={styles.recordLabel}>퇴근</Text>
              <Text style={styles.recordValue}>
                {formatTime(todayAttendance?.checkOut)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Weekly Hours */}
        <Card style={styles.card}>
          <WorkHoursGauge
            currentHours={weeklyHours?.totalHours || 0}
            maxHours={52}
          />
        </Card>

        {/* Quick Menu */}
        <View style={styles.quickMenuContainer}>
          <Text style={styles.sectionTitle}>빠른 메뉴</Text>
          <View style={styles.quickMenu}>
            <QuickMenuItem icon="📅" label="연차 신청" onPress={() => navigation.navigate('Leave')} />
            <QuickMenuItem icon="💰" label="급여 명세서" />
            <QuickMenuItem icon="📄" label="증명서 발급" />
            <QuickMenuItem icon="📝" label="전자계약" onPress={() => navigation.navigate('Contract')} />
          </View>
        </View>

        {/* Leave Balance */}
        <Card style={styles.card}>
          <View style={styles.leaveHeader}>
            <Text style={styles.cardTitle}>연차 현황</Text>
          </View>
          <View style={styles.leaveStats}>
            <View style={styles.leaveStat}>
              <Text style={styles.leaveValue}>{user?.annualLeave || 0}</Text>
              <Text style={styles.leaveLabel}>총 연차</Text>
            </View>
            <View style={styles.leaveStat}>
              <Text style={styles.leaveValue}>{user?.usedLeave || 0}</Text>
              <Text style={styles.leaveLabel}>사용</Text>
            </View>
            <View style={styles.leaveStat}>
              <Text style={[styles.leaveValue, { color: colors.primary }]}>
                {(user?.annualLeave || 0) - (user?.usedLeave || 0)}
              </Text>
              <Text style={styles.leaveLabel}>잔여</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const QuickMenuItem: React.FC<{ icon: string; label: string; onPress?: () => void }> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickMenuItem} onPress={onPress}>
    <View style={styles.quickMenuIcon}>
      <Text style={styles.quickMenuEmoji}>{icon}</Text>
    </View>
    <Text style={styles.quickMenuLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  currentTime: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  checkInCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  todayRecord: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    width: '100%',
  },
  recordItem: {
    flex: 1,
    alignItems: 'center',
  },
  recordDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  recordLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  recordValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  quickMenuContainer: {
    marginBottom: spacing.md,
  },
  quickMenu: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickMenuItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickMenuIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickMenuEmoji: {
    fontSize: 24,
  },
  quickMenuLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  leaveHeader: {
    marginBottom: spacing.md,
  },
  leaveStats: {
    flexDirection: 'row',
  },
  leaveStat: {
    flex: 1,
    alignItems: 'center',
  },
  leaveValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  leaveLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
