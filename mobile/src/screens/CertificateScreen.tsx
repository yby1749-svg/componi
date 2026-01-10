import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { Certificate } from '../types';

// 증명서 유형
const CERTIFICATE_TYPES = [
  {
    value: 'EMPLOYMENT',
    label: '재직증명서',
    icon: '📋',
    description: '현재 재직 중임을 증명하는 서류',
  },
  {
    value: 'CAREER',
    label: '경력증명서',
    icon: '📄',
    description: '근무 경력을 증명하는 서류',
  },
  {
    value: 'INCOME',
    label: '소득금액증명원',
    icon: '💵',
    description: '소득 금액을 증명하는 서류',
  },
];

// 제출처 옵션
const PURPOSE_OPTIONS = [
  '금융기관 제출용',
  '관공서 제출용',
  '이직용',
  '비자 신청용',
  '기타',
];

// 데모 증명서 데이터
const generateDemoCertificates = (): Certificate[] => {
  const now = new Date();

  return [
    {
      id: 'cert-1',
      type: 'EMPLOYMENT',
      purpose: '금융기관 제출용',
      status: 'ISSUED',
      filePath: '/certificates/cert-1.pdf',
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString(),
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 19).toISOString(),
    },
    {
      id: 'cert-2',
      type: 'CAREER',
      purpose: '이직용',
      status: 'PENDING',
      createdAt: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
    },
    {
      id: 'cert-3',
      type: 'INCOME',
      purpose: '비자 신청용',
      status: 'ISSUED',
      filePath: '/certificates/cert-3.pdf',
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString(),
      createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 8).toISOString(),
    },
  ];
};

export const CertificateScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, token } = useAuthStore();
  const isDemo = token === 'demo-token-12345' || user?.id === 'demo-user-001';

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 신청 폼 상태
  const [selectedType, setSelectedType] = useState(CERTIFICATE_TYPES[0]);
  const [selectedPurpose, setSelectedPurpose] = useState(PURPOSE_OPTIONS[0]);
  const [customPurpose, setCustomPurpose] = useState('');

  useEffect(() => {
    if (isDemo) {
      setCertificates(generateDemoCertificates());
    } else {
      fetchCertificates();
    }
  }, [isDemo]);

  const fetchCertificates = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.MY_CERTIFICATES);
      setCertificates(response.data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    }
  };

  const handleSubmit = async () => {
    const purpose = selectedPurpose === '기타' ? customPurpose : selectedPurpose;

    if (selectedPurpose === '기타' && !customPurpose.trim()) {
      Alert.alert('알림', '제출처를 입력해주세요.');
      return;
    }

    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        const newCertificate: Certificate = {
          id: `cert-${Date.now()}`,
          type: selectedType.value as Certificate['type'],
          purpose,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        setCertificates([newCertificate, ...certificates]);
        setModalVisible(false);
        setCustomPurpose('');
        setLoading(false);
        Alert.alert('신청 완료', '증명서 발급 신청이 완료되었습니다.\n발급까지 1~2일 소요됩니다.');
      }, 500);
      return;
    }

    try {
      await api.post(API_ENDPOINTS.CERTIFICATE_REQUEST, {
        type: selectedType.value,
        purpose,
      });
      await fetchCertificates();
      setModalVisible(false);
      setCustomPurpose('');
      Alert.alert('신청 완료', '증명서 발급 신청이 완료되었습니다.\n발급까지 1~2일 소요됩니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.error || '신청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate: Certificate) => {
    if (isDemo) {
      Alert.alert('다운로드', '데모 모드에서는 다운로드가 지원되지 않습니다.');
      return;
    }
    // 실제로는 파일 다운로드 구현
    Alert.alert('다운로드', '증명서 다운로드를 시작합니다.');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return { bg: colors.successLight, color: colors.success, label: '발급완료' };
      case 'REJECTED':
        return { bg: colors.errorLight, color: colors.error, label: '반려' };
      default:
        return { bg: colors.warningLight, color: colors.warning, label: '처리중' };
    }
  };

  const getTypeLabel = (type: string) => {
    return CERTIFICATE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: string) => {
    return CERTIFICATE_TYPES.find(t => t.value === type)?.icon || '📄';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const renderCertificateItem = (certificate: Certificate) => {
    const status = getStatusStyle(certificate.status);
    const isIssued = certificate.status === 'ISSUED';

    return (
      <View key={certificate.id} style={styles.certificateItem}>
        <View style={styles.certificateHeader}>
          <View style={styles.certificateTypeContainer}>
            <Text style={styles.certificateIcon}>{getTypeIcon(certificate.type)}</Text>
            <Text style={styles.certificateType}>{getTypeLabel(certificate.type)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.certificatePurpose}>{certificate.purpose}</Text>
        <View style={styles.certificateDates}>
          <Text style={styles.dateLabel}>신청일: {formatDate(certificate.createdAt)}</Text>
          {certificate.issuedAt && (
            <Text style={styles.dateLabel}>발급일: {formatDate(certificate.issuedAt)}</Text>
          )}
        </View>
        {isIssued && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleDownload(certificate)}
          >
            <Text style={styles.downloadButtonText}>다운로드</Text>
          </TouchableOpacity>
        )}
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
        <Text style={styles.title}>증명서 발급</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* 증명서 유형 카드 */}
        <View style={styles.typeSection}>
          <Text style={styles.sectionTitle}>증명서 종류</Text>
          <View style={styles.typeGrid}>
            {CERTIFICATE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.typeCard}
                onPress={() => {
                  setSelectedType(type);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 신청 내역 */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>신청 내역</Text>
          {certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>신청 내역이 없습니다.</Text>
            </View>
          ) : (
            certificates.map(renderCertificateItem)
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
            <Text style={styles.modalTitle}>증명서 신청</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 선택된 증명서 유형 */}
            <Card style={styles.selectedTypeCard}>
              <Text style={styles.selectedTypeIcon}>{selectedType.icon}</Text>
              <Text style={styles.selectedTypeLabel}>{selectedType.label}</Text>
              <Text style={styles.selectedTypeDescription}>{selectedType.description}</Text>
            </Card>

            {/* 증명서 유형 변경 */}
            <Text style={styles.formLabel}>증명서 종류</Text>
            <View style={styles.typeSelector}>
              {CERTIFICATE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeSelectorButton,
                    selectedType.value === type.value && styles.typeSelectorButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text
                    style={[
                      styles.typeSelectorText,
                      selectedType.value === type.value && styles.typeSelectorTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 제출처 선택 */}
            <Text style={styles.formLabel}>제출처</Text>
            <View style={styles.purposeSelector}>
              {PURPOSE_OPTIONS.map((purpose) => (
                <TouchableOpacity
                  key={purpose}
                  style={[
                    styles.purposeButton,
                    selectedPurpose === purpose && styles.purposeButtonSelected,
                  ]}
                  onPress={() => setSelectedPurpose(purpose)}
                >
                  <Text
                    style={[
                      styles.purposeButtonText,
                      selectedPurpose === purpose && styles.purposeButtonTextSelected,
                    ]}
                  >
                    {purpose}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 기타 제출처 입력 */}
            {selectedPurpose === '기타' && (
              <TextInput
                style={styles.customPurposeInput}
                placeholder="제출처를 입력하세요"
                placeholderTextColor={colors.textTertiary}
                value={customPurpose}
                onChangeText={setCustomPurpose}
              />
            )}

            {/* 안내 사항 */}
            <Card style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>안내 사항</Text>
              <Text style={styles.noticeText}>
                • 증명서 발급까지 1~2 영업일이 소요됩니다.{'\n'}
                • 발급 완료 시 알림을 보내드립니다.{'\n'}
                • 발급된 증명서는 30일간 다운로드 가능합니다.
              </Text>
            </Card>

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
  typeSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  typeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  certificateItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  certificateTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  certificateIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  certificateType: {
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
  certificatePurpose: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  certificateDates: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  downloadButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  downloadButtonText: {
    fontSize: fontSize.sm,
    color: colors.textWhite,
    fontWeight: fontWeight.medium,
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
  selectedTypeCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  selectedTypeIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  selectedTypeLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  selectedTypeDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
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
    gap: spacing.sm,
  },
  typeSelectorButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeSelectorButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeSelectorText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeSelectorTextSelected: {
    color: colors.textWhite,
    fontWeight: fontWeight.medium,
  },
  purposeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  purposeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  purposeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  purposeButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  purposeButtonTextSelected: {
    color: colors.textWhite,
  },
  customPurposeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  noticeCard: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
    marginTop: spacing.lg,
  },
  noticeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  noticeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
});
