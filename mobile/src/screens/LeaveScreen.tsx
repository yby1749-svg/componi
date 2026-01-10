import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { LeaveRequest, LeaveBalance } from '../types';

// 휴가 유형
const LEAVE_TYPES = [
  { value: 'ANNUAL', label: '연차', days: 1 },
  { value: 'HALF_AM', label: '오전 반차', days: 0.5 },
  { value: 'HALF_PM', label: '오후 반차', days: 0.5 },
  { value: 'SICK', label: '병가', days: 1 },
  { value: 'SPECIAL', label: '특별휴가', days: 1 },
];

// 데모 휴가 신청 내역
const generateDemoLeaveRequests = (): LeaveRequest[] => {
  const requests: LeaveRequest[] = [];
  const now = new Date();

  // 승인된 휴가
  requests.push({
    id: 'leave-1',
    type: 'ANNUAL',
    startDate: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() - 1, 16).toISOString(),
    days: 2,
    reason: '개인 사유',
    status: 'APPROVED',
    createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString(),
  });

  // 대기 중인 휴가
  requests.push({
    id: 'leave-2',
    type: 'ANNUAL',
    startDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 5).toISOString(),
    days: 1,
    reason: '병원 예약',
    status: 'PENDING',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 20).toISOString(),
  });

  // 반차
  requests.push({
    id: 'leave-3',
    type: 'HALF_AM',
    startDate: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString(),
    days: 0.5,
    reason: '관공서 방문',
    status: 'APPROVED',
    createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 18).toISOString(),
  });

  return requests;
};

export const LeaveScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, token } = useAuthStore();
  const isDemo = token === 'demo-token-12345' || user?.id === 'demo-user-001';

  const [modalVisible, setModalVisible] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // 신청 폼 상태
  const [selectedType, setSelectedType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');

  const leaveBalance: LeaveBalance = {
    total: user?.annualLeave || 15,
    used: user?.usedLeave || 3,
    remaining: (user?.annualLeave || 15) - (user?.usedLeave || 3),
  };

  useEffect(() => {
    if (isDemo) {
      setLeaveRequests(generateDemoLeaveRequests());
    } else {
      fetchLeaveRequests();
    }
  }, [isDemo]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.MY_LEAVE_REQUESTS);
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('알림', '사유를 입력해주세요.');
      return;
    }

    const days = selectedType.value.startsWith('HALF')
      ? 0.5
      : Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (days > leaveBalance.remaining && ['ANNUAL', 'HALF_AM', 'HALF_PM'].includes(selectedType.value)) {
      Alert.alert('알림', `잔여 연차(${leaveBalance.remaining}일)가 부족합니다.`);
      return;
    }

    setLoading(true);

    if (isDemo) {
      // 데모 모드
      setTimeout(() => {
        const newRequest: LeaveRequest = {
          id: `leave-${Date.now()}`,
          type: selectedType.value as LeaveRequest['type'],
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
          reason,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        setLeaveRequests([newRequest, ...leaveRequests]);
        setModalVisible(false);
        setReason('');
        setLoading(false);
        Alert.alert('신청 완료', '휴가 신청이 완료되었습니다.');
      }, 500);
      return;
    }

    try {
      await api.post(API_ENDPOINTS.LEAVE_REQUEST, {
        type: selectedType.value,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason,
      });
      await fetchLeaveRequests();
      setModalVisible(false);
      setReason('');
      Alert.alert('신청 완료', '휴가 신청이 완료되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.error || '신청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    Alert.alert(
      '휴가 취소',
      '신청을 취소하시겠습니까?',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예',
          style: 'destructive',
          onPress: async () => {
            if (isDemo) {
              setLeaveRequests(leaveRequests.filter(r => r.id !== id));
              Alert.alert('취소 완료', '휴가 신청이 취소되었습니다.');
              return;
            }
            try {
              await api.delete(`/leave/${id}`);
              await fetchLeaveRequests();
              Alert.alert('취소 완료', '휴가 신청이 취소되었습니다.');
            } catch (error) {
              Alert.alert('오류', '취소에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { bg: colors.successLight, color: colors.success, label: '승인' };
      case 'REJECTED':
        return { bg: colors.errorLight, color: colors.error, label: '반려' };
      case 'CANCELLED':
        return { bg: colors.surfaceSecondary, color: colors.textTertiary, label: '취소' };
      default:
        return { bg: colors.warningLight, color: colors.warning, label: '대기' };
    }
  };

  const getTypeLabel = (type: string) => {
    return LEAVE_TYPES.find(t => t.value === type)?.label || type;
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequest }) => {
    const status = getStatusStyle(item.status);
    const isPending = item.status === 'PENDING';

    return (
      <View style={styles.leaveItem}>
        <View style={styles.leaveHeader}>
          <View style={styles.leaveTypeContainer}>
            <Text style={styles.leaveType}>{getTypeLabel(item.type)}</Text>
            <Text style={styles.leaveDays}>{item.days}일</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.leaveDates}>
          <Text style={styles.dateText}>
            {formatDateFull(item.startDate)}
            {item.startDate !== item.endDate && ` ~ ${formatDateFull(item.endDate)}`}
          </Text>
        </View>
        {item.reason && (
          <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
        )}
        {isPending && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancel(item.id)}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 간단한 날짜 선택 (실제로는 DatePicker 사용)
  const DateSelector: React.FC<{
    label: string;
    date: Date;
    onDateChange: (date: Date) => void;
  }> = ({ label, date, onDateChange }) => {
    const addDays = (days: number) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      onDateChange(newDate);
    };

    return (
      <View style={styles.dateSelector}>
        <Text style={styles.dateSelectorLabel}>{label}</Text>
        <View style={styles.dateSelectorRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => addDays(-1)}>
            <Text style={styles.dateButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.dateValue}>{formatDateFull(date.toISOString())}</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => addDays(1)}>
            <Text style={styles.dateButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>휴가 신청</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* 연차 현황 */}
        <Card style={styles.balanceCard}>
          <Text style={styles.sectionTitle}>연차 현황</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{leaveBalance.total}</Text>
              <Text style={styles.balanceLabel}>총 연차</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceValue}>{leaveBalance.used}</Text>
              <Text style={styles.balanceLabel}>사용</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceValue, { color: colors.primary }]}>
                {leaveBalance.remaining}
              </Text>
              <Text style={styles.balanceLabel}>잔여</Text>
            </View>
          </View>
        </Card>

        {/* 신청 버튼 */}
        <Button
          title="휴가 신청하기"
          onPress={() => setModalVisible(true)}
          size="lg"
          style={styles.requestButton}
        />

        {/* 신청 내역 */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>신청 내역</Text>
          {leaveRequests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>신청 내역이 없습니다.</Text>
            </View>
          ) : (
            leaveRequests.map((item) => (
              <View key={item.id}>
                {renderLeaveItem({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 신청 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>휴가 신청</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 휴가 유형 선택 */}
            <Text style={styles.formLabel}>휴가 유형</Text>
            <View style={styles.typeSelector}>
              {LEAVE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    selectedType.value === type.value && styles.typeButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType.value === type.value && styles.typeButtonTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 날짜 선택 */}
            <DateSelector
              label="시작일"
              date={startDate}
              onDateChange={setStartDate}
            />

            {!selectedType.value.startsWith('HALF') && (
              <DateSelector
                label="종료일"
                date={endDate}
                onDateChange={setEndDate}
              />
            )}

            {/* 사유 입력 */}
            <Text style={styles.formLabel}>사유</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="휴가 사유를 입력하세요"
              placeholderTextColor={colors.textTertiary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            {/* 신청 버튼 */}
            <Button
              title="신청하기"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: fontSize.xxl,
    color: colors.textPrimary,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  balanceCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  requestButton: {
    marginBottom: spacing.lg,
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  leaveItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leaveTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveType: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  leaveDays: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
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
  leaveDates: {
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  reasonText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  cancelButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    color: colors.error,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  modalCancel: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  formLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  typeButtonTextSelected: {
    color: colors.textWhite,
  },
  dateSelector: {
    marginTop: spacing.md,
  },
  dateSelectorLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  dateValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginHorizontal: spacing.lg,
  },
  reasonInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
