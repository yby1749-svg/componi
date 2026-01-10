import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../constants/theme';

interface WorkHoursGaugeProps {
  currentHours: number;
  maxHours?: number;
  label?: string;
}

export const WorkHoursGauge: React.FC<WorkHoursGaugeProps> = ({
  currentHours,
  maxHours = 52,
  label = '이번 주 근무시간',
}) => {
  const percentage = Math.min((currentHours / maxHours) * 100, 100);
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 95;

  const barColor = isDanger
    ? colors.error
    : isWarning
    ? colors.warning
    : colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.hours}>
          <Text style={[styles.currentHours, { color: barColor }]}>
            {currentHours.toFixed(1)}
          </Text>
          <Text style={styles.maxHours}> / {maxHours}시간</Text>
        </Text>
      </View>
      <View style={styles.gaugeContainer}>
        <View style={[styles.gaugeBar, { width: `${percentage}%`, backgroundColor: barColor }]} />
      </View>
      {isWarning && (
        <Text style={[styles.warning, { color: barColor }]}>
          {isDanger ? '주 52시간 초과 위험!' : '주 52시간에 근접 중'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  hours: {
    fontSize: fontSize.md,
  },
  currentHours: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  maxHours: {
    color: colors.textTertiary,
  },
  gaugeContainer: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  gaugeBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  warning: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
});
