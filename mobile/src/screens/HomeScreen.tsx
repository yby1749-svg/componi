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
import * as Location from 'expo-location';
import { Card, CheckInButton, WorkHoursGauge } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { Attendance, WeeklyHours, Workplace } from '../types';

export const HomeScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours | null>(null);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  const fetchData = useCallback(async () => {
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
  }, []);

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
    const isCheckingIn = !todayAttendance?.checkIn;

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한 필요', '출퇴근 체크를 위해 위치 권한이 필요합니다.');
      return;
    }

    setCheckInLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      if (isCheckingIn) {
        // Check-in: need to select workplace
        if (workplaces.length === 0) {
          Alert.alert('오류', '등록된 근무지가 없습니다. 관리자에게 문의하세요.');
          return;
        }

        // For simplicity, use first workplace. In production, show picker
        const workplace = workplaces[0];

        const response = await api.post(API_ENDPOINTS.CHECK_IN, {
          latitude,
          longitude,
          workplaceId: workplace.id,
        });

        Alert.alert('출근 완료', response.data.message);
      } else {
        // Check-out
        const response = await api.post(API_ENDPOINTS.CHECK_OUT, {
          latitude,
          longitude,
        });

        const { workHours, workMinutesRemainder } = response.data;
        Alert.alert(
          '퇴근 완료',
          `오늘 근무시간: ${workHours}시간 ${workMinutesRemainder}분`
        );
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
            <QuickMenuItem icon="📅" label="연차 신청" />
            <QuickMenuItem icon="💰" label="급여 명세서" />
            <QuickMenuItem icon="📄" label="증명서 발급" />
            <QuickMenuItem icon="📝" label="전자계약" />
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

const QuickMenuItem: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <TouchableOpacity style={styles.quickMenuItem}>
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
