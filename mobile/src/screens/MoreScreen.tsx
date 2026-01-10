import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export const MoreScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>더보기</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileDept}>
              {user?.department?.name} · {user?.position?.name}
            </Text>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>인사 서류</Text>
          <MenuItem icon="📄" label="전자계약" />
          <MenuItem icon="📋" label="재직증명서 발급" />
          <MenuItem icon="💳" label="원천징수영수증" />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>계정 설정</Text>
          <MenuItem icon="👤" label="내 정보 수정" />
          <MenuItem icon="🔒" label="비밀번호 변경" />
          <MenuItem icon="🔐" label="생체인증 설정" />
          <MenuItem icon="🔔" label="알림 설정" />
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <MenuItem icon="📖" label="이용약관" />
          <MenuItem icon="🛡️" label="개인정보처리방침" />
          <MenuItem icon="ℹ️" label="버전 정보" value="1.0.0" />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem: React.FC<{
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}> = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
    {value && <Text style={styles.menuValue}>{value}</Text>}
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textWhite,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileDept: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: 2,
  },
  menuSection: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  menuValue: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginRight: spacing.sm,
  },
  menuArrow: {
    fontSize: fontSize.xl,
    color: colors.textTertiary,
  },
  logoutButton: {
    margin: spacing.lg,
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.error,
  },
});
