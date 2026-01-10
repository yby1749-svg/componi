import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { Payroll } from '../types';

export const PayrollScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.MY_PAYROLLS);
      setPayrolls(response.data);
      if (response.data.length > 0 && !selectedPayroll) {
        setSelectedPayroll(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    }
  }, [selectedPayroll]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  const renderPayrollItem = ({ item }: { item: Payroll }) => {
    const isSelected = selectedPayroll?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.monthItem, isSelected && styles.monthItemSelected]}
        onPress={() => setSelectedPayroll(item)}
      >
        <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
          {item.year}.{String(item.month).padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>급여 명세서</Text>
      </View>

      {/* Month Selector */}
      <FlatList
        horizontal
        data={payrolls}
        renderItem={renderPayrollItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.monthList}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {selectedPayroll ? (
        <View style={styles.content}>
          {/* Net Pay */}
          <Card style={styles.netPayCard}>
            <Text style={styles.netPayLabel}>실수령액</Text>
            <Text style={styles.netPayAmount}>
              {formatCurrency(selectedPayroll.netPay)}
            </Text>
          </Card>

          {/* Payment Details */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>지급 내역</Text>
            <PayrollRow label="기본급" value={selectedPayroll.baseSalary} />
            <PayrollRow label="연장근로수당" value={selectedPayroll.overtimePay} />
            <PayrollRow label="상여금" value={selectedPayroll.bonus} />
            <PayrollRow
              label="지급 총액"
              value={
                selectedPayroll.baseSalary +
                selectedPayroll.overtimePay +
                selectedPayroll.bonus +
                selectedPayroll.totalAllowance
              }
              isTotal
            />
          </Card>

          {/* Deductions */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>공제 내역</Text>
            <PayrollRow label="국민연금" value={selectedPayroll.nationalPension} isDeduction />
            <PayrollRow label="건강보험" value={selectedPayroll.healthInsurance} isDeduction />
            <PayrollRow label="장기요양보험" value={selectedPayroll.longTermCare} isDeduction />
            <PayrollRow label="고용보험" value={selectedPayroll.employmentIns} isDeduction />
            <PayrollRow label="소득세" value={selectedPayroll.incomeTax} isDeduction />
            <PayrollRow label="지방소득세" value={selectedPayroll.localIncomeTax} isDeduction />
            <PayrollRow
              label="공제 총액"
              value={selectedPayroll.totalDeduction}
              isTotal
              isDeduction
            />
          </Card>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>급여 내역이 없습니다.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const PayrollRow: React.FC<{
  label: string;
  value: number;
  isTotal?: boolean;
  isDeduction?: boolean;
}> = ({ label, value, isTotal, isDeduction }) => (
  <View style={[styles.payrollRow, isTotal && styles.payrollRowTotal]}>
    <Text style={[styles.payrollLabel, isTotal && styles.payrollLabelTotal]}>
      {label}
    </Text>
    <Text
      style={[
        styles.payrollValue,
        isTotal && styles.payrollValueTotal,
        isDeduction && styles.payrollValueDeduction,
      ]}
    >
      {isDeduction && value > 0 ? '-' : ''}
      {value.toLocaleString('ko-KR')}원
    </Text>
  </View>
);

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
  monthList: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  monthItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  monthItemSelected: {
    backgroundColor: colors.primary,
  },
  monthText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  monthTextSelected: {
    color: colors.textWhite,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  netPayCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  netPayLabel: {
    fontSize: fontSize.md,
    color: colors.textWhite,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  netPayAmount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.textWhite,
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  payrollRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  payrollLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  payrollLabelTotal: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  payrollValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  payrollValueTotal: {
    fontWeight: fontWeight.bold,
  },
  payrollValueDeduction: {
    color: colors.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
