import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, fontSize, fontWeight, shadow } from '../constants/theme';

interface CheckInButtonProps {
  isCheckedIn: boolean;
  onPress: () => void;
  loading?: boolean;
  currentTime?: string;
}

export const CheckInButton: React.FC<CheckInButtonProps> = ({
  isCheckedIn,
  onPress,
  loading = false,
  currentTime,
}) => {
  const buttonColor = isCheckedIn ? colors.error : colors.primary;
  const buttonText = isCheckedIn ? '퇴근' : '출근';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }, shadow.lg]}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.textWhite} size="large" />
        ) : (
          <>
            <Text style={styles.buttonText}>{buttonText}</Text>
            {currentTime && (
              <Text style={styles.timeText}>{currentTime}</Text>
            )}
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.label}>
        {isCheckedIn ? '퇴근하기' : '출근하기'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  timeText: {
    color: colors.textWhite,
    fontSize: fontSize.sm,
    marginTop: 4,
    opacity: 0.9,
  },
  label: {
    marginTop: 12,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
