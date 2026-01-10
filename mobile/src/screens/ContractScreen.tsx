import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { Card, Button } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { Contract } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 계약서 유형 라벨
const CONTRACT_TYPE_LABELS: Record<string, string> = {
  EMPLOYMENT: '근로계약서',
  NDA: '비밀유지서약서',
  CONFIDENTIALITY: '개인정보동의서',
  OTHER: '기타 계약서',
};

// 데모 계약서 데이터
const generateDemoContracts = (): Contract[] => {
  const now = new Date();

  return [
    {
      id: 'contract-1',
      type: 'EMPLOYMENT',
      title: '2024년 근로계약서',
      content: `근로계약서

제1조 (목적)
본 계약은 회사와 근로자 간의 근로조건을 명확히 하여 상호 권리와 의무를 규정함을 목적으로 한다.

제2조 (근로계약기간)
근로계약기간은 2024년 1월 1일부터 기간의 정함이 없는 것으로 한다.

제3조 (근무장소)
근무장소는 회사 본사로 하며, 업무상 필요한 경우 변경될 수 있다.

제4조 (업무내용)
근로자의 업무내용은 개발 업무로 한다.

제5조 (근로시간)
1. 근로시간은 휴게시간을 제외하고 1일 8시간, 1주 40시간으로 한다.
2. 시업시각: 09:00, 종업시각: 18:00
3. 휴게시간: 12:00 ~ 13:00

제6조 (휴일)
주휴일은 일요일로 하며, 근로자의 날 등 법정휴일은 유급휴일로 한다.

제7조 (임금)
1. 월 기본급: 3,500,000원
2. 임금 지급일: 매월 10일

제8조 (연차유급휴가)
연차유급휴가는 근로기준법에서 정하는 바에 따른다.

본 계약의 내용을 증명하기 위하여 계약서 2통을 작성하여 각 1통씩 보관한다.`,
      status: 'PENDING',
      sentAt: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    },
    {
      id: 'contract-2',
      type: 'NDA',
      title: '비밀유지서약서',
      content: `비밀유지서약서

본인은 컴포니 주식회사에 입사함에 있어 다음 사항을 서약합니다.

1. 본인은 재직 중 업무상 알게 된 회사의 기밀정보를 재직 중은 물론 퇴직 후에도 외부에 누설하거나 공개하지 않겠습니다.

2. 기밀정보란 다음을 포함합니다:
   - 회사의 영업비밀, 기술정보, 고객정보
   - 인사, 재무, 경영에 관한 정보
   - 기타 회사가 비밀로 관리하는 일체의 정보

3. 본인은 업무 수행 중 작성하거나 취득한 모든 문서, 자료, 데이터를 퇴직 시 반환하겠습니다.

4. 본 서약을 위반할 경우 민형사상 책임을 질 것을 확약합니다.

위와 같이 서약합니다.`,
      status: 'SIGNED',
      sentAt: new Date(now.getFullYear(), 0, 15).toISOString(),
      signedAt: new Date(now.getFullYear(), 0, 15).toISOString(),
    },
    {
      id: 'contract-3',
      type: 'CONFIDENTIALITY',
      title: '개인정보 수집 및 이용 동의서',
      content: `개인정보 수집 및 이용 동의서

컴포니 주식회사는 인사관리 업무를 위해 아래와 같이 개인정보를 수집, 이용하고자 합니다.

1. 수집하는 개인정보 항목
   - 필수항목: 성명, 생년월일, 연락처, 주소, 이메일
   - 선택항목: 가족관계, 학력, 경력사항

2. 개인정보의 수집 및 이용 목적
   - 인사관리, 급여 지급, 4대보험 가입
   - 복리후생 제공, 비상연락

3. 개인정보의 보유 및 이용 기간
   - 근로관계 종료 후 3년간 보관

4. 동의 거부권 및 불이익
   - 위 개인정보 수집에 대한 동의를 거부할 수 있으며, 다만 필수항목에 대한 동의 거부 시 근로계약 체결이 불가할 수 있습니다.

위 내용을 확인하였으며, 개인정보 수집 및 이용에 동의합니다.`,
      status: 'SIGNED',
      sentAt: new Date(now.getFullYear(), 0, 15).toISOString(),
      signedAt: new Date(now.getFullYear(), 0, 15).toISOString(),
    },
  ];
};

export const ContractScreen: React.FC = () => {
  const navigation = useNavigation();
  const signatureRef = useRef<SignatureViewRef>(null);
  const { user, token } = useAuthStore();
  const isDemo = token === 'demo-token-12345' || user?.id === 'demo-user-001';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setContracts(generateDemoContracts());
    } else {
      fetchContracts();
    }
  }, [isDemo]);

  const fetchContracts = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.MY_CONTRACTS);
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetail(true);
  };

  const handleSignContract = () => {
    setShowDetail(false);
    setShowSignature(true);
  };

  const handleSignatureEnd = () => {
    signatureRef.current?.readSignature();
  };

  const handleSignatureOK = (sig: string) => {
    setSignature(sig);
  };

  const handleSignatureClear = () => {
    signatureRef.current?.clearSignature();
    setSignature(null);
  };

  const handleSubmitSignature = async () => {
    if (!signature || !selectedContract) {
      Alert.alert('알림', '서명을 입력해주세요.');
      return;
    }

    setLoading(true);

    if (isDemo) {
      setTimeout(() => {
        setContracts(contracts.map(c =>
          c.id === selectedContract.id
            ? { ...c, status: 'SIGNED' as const, signedAt: new Date().toISOString() }
            : c
        ));
        setShowSignature(false);
        setSignature(null);
        setSelectedContract(null);
        setLoading(false);
        Alert.alert('서명 완료', '계약서에 서명이 완료되었습니다.');
      }, 500);
      return;
    }

    try {
      await api.post(`/contracts/${selectedContract.id}/sign`, {
        signature,
      });
      await fetchContracts();
      setShowSignature(false);
      setSignature(null);
      setSelectedContract(null);
      Alert.alert('서명 완료', '계약서에 서명이 완료되었습니다.');
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.error || '서명에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return { bg: colors.successLight, color: colors.success, label: '서명완료' };
      case 'EXPIRED':
        return { bg: colors.errorLight, color: colors.error, label: '만료' };
      case 'CANCELLED':
        return { bg: colors.surfaceSecondary, color: colors.textTertiary, label: '취소' };
      default:
        return { bg: colors.warningLight, color: colors.warning, label: '서명대기' };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const pendingCount = contracts.filter(c => c.status === 'PENDING').length;

  const renderContractItem = (contract: Contract) => {
    const status = getStatusStyle(contract.status);

    return (
      <TouchableOpacity
        key={contract.id}
        style={styles.contractItem}
        onPress={() => handleViewContract(contract)}
      >
        <View style={styles.contractHeader}>
          <View style={styles.contractTypeContainer}>
            <Text style={styles.contractType}>
              {CONTRACT_TYPE_LABELS[contract.type] || contract.type}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.contractTitle}>{contract.title}</Text>
        <View style={styles.contractDates}>
          <Text style={styles.dateLabel}>
            발송일: {formatDate(contract.sentAt)}
          </Text>
          {contract.signedAt && (
            <Text style={styles.dateLabel}>
              서명일: {formatDate(contract.signedAt)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
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
        <Text style={styles.title}>전자계약</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* 서명 대기 알림 */}
        {pendingCount > 0 && (
          <Card style={styles.alertCard}>
            <View style={styles.alertContent}>
              <Text style={styles.alertIcon}>✍️</Text>
              <View style={styles.alertTextContainer}>
                <Text style={styles.alertTitle}>서명 대기 중인 계약서</Text>
                <Text style={styles.alertDescription}>
                  {pendingCount}건의 계약서가 서명을 기다리고 있습니다.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* 계약서 목록 */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>계약서 목록</Text>
          {contracts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>계약서가 없습니다.</Text>
            </View>
          ) : (
            contracts.map(renderContractItem)
          )}
        </View>
      </ScrollView>

      {/* 계약서 상세 모달 */}
      <Modal
        visible={showDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetail(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetail(false)}>
              <Text style={styles.modalCancel}>닫기</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>계약서 상세</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedContract && (
              <>
                <View style={styles.contractDetailHeader}>
                  <Text style={styles.contractDetailType}>
                    {CONTRACT_TYPE_LABELS[selectedContract.type]}
                  </Text>
                  <Text style={styles.contractDetailTitle}>
                    {selectedContract.title}
                  </Text>
                </View>

                <View style={styles.contractBody}>
                  <Text style={styles.contractContent}>
                    {selectedContract.content}
                  </Text>
                </View>

                {selectedContract.status === 'PENDING' && (
                  <Button
                    title="서명하기"
                    onPress={handleSignContract}
                    size="lg"
                    style={styles.signButton}
                  />
                )}

                {selectedContract.status === 'SIGNED' && (
                  <View style={styles.signedInfo}>
                    <Text style={styles.signedText}>
                      ✓ {formatDate(selectedContract.signedAt)}에 서명 완료
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 서명 모달 */}
      <Modal
        visible={showSignature}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowSignature(false)}
      >
        <SafeAreaView style={styles.signatureContainer}>
          <View style={styles.signatureHeader}>
            <TouchableOpacity onPress={() => {
              setShowSignature(false);
              setSignature(null);
            }}>
              <Text style={styles.modalCancel}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>서명</Text>
            <TouchableOpacity onPress={handleSignatureClear}>
              <Text style={styles.clearButton}>지우기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signatureInfo}>
            <Text style={styles.signatureInfoText}>
              아래 영역에 서명해주세요
            </Text>
          </View>

          <View style={styles.signatureCanvasContainer}>
            <SignatureScreen
              ref={signatureRef}
              onEnd={handleSignatureEnd}
              onOK={handleSignatureOK}
              onEmpty={() => setSignature(null)}
              autoClear={false}
              descriptionText=""
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: none;
                  margin: 0;
                }
                .m-signature-pad--body {
                  border: none;
                }
                .m-signature-pad--footer {
                  display: none;
                }
                body, html {
                  width: 100%;
                  height: 100%;
                }
              `}
              backgroundColor={colors.surface}
              penColor={colors.textPrimary}
            />
          </View>

          <View style={styles.signatureActions}>
            <Button
              title="서명 완료"
              onPress={handleSubmitSignature}
              loading={loading}
              disabled={!signature}
              size="lg"
              style={styles.submitSignatureButton}
            />
          </View>
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
  alertCard: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  alertDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  listSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  contractItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contractTypeContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  contractType: {
    fontSize: fontSize.xs,
    color: colors.textWhite,
    fontWeight: fontWeight.medium,
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
  contractTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  contractDates: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateLabel: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
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
  contractDetailHeader: {
    marginBottom: spacing.lg,
  },
  contractDetailType: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  },
  contractDetailTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  contractBody: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  contractContent: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  signButton: {
    marginBottom: spacing.xxl,
  },
  signedInfo: {
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  signedText: {
    fontSize: fontSize.md,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },
  // Signature styles
  signatureContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  clearButton: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  signatureInfo: {
    padding: spacing.md,
    alignItems: 'center',
  },
  signatureInfoText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  signatureCanvasContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  signatureActions: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  submitSignatureButton: {
    marginBottom: spacing.md,
  },
});
