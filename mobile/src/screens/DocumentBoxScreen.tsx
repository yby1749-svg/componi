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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Card, Button } from '../components';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  getReceivedDocuments,
  updateDocumentStatus,
  ReceivedDocument,
} from '../services/documentService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 카테고리 라벨
const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: '계약서',
  CERTIFICATE: '증명서',
  RESUME: '이력서',
  OTHER: '기타',
};

// 상태 라벨
const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기중',
  SUBMITTED: '제출완료',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

// Use ReceivedDocument from documentService

type TabType = 'pending' | 'completed';

export default function DocumentBoxScreen() {
  const navigation = useNavigation();
  const { token, user } = useAuthStore();
  const signatureRef = useRef<SignatureViewRef>(null);

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [documents, setDocuments] = useState<ReceivedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ReceivedDocument | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 문서 목록 로드
  const loadDocuments = async () => {
    try {
      const docs = await getReceivedDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      Alert.alert('오류', '서류 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  // 파일 선택 및 업로드
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        Alert.alert(
          '파일 선택됨',
          `파일명: ${asset.name}\n크기: ${(asset.size || 0 / 1024).toFixed(1)}KB`,
          [
            { text: '취소', style: 'cancel' },
            {
              text: '제출',
              onPress: () => handleSubmitWithFile(asset),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Document picking error:', error);
      Alert.alert('오류', '파일 선택에 실패했습니다.');
    }
  };

  // 파일과 함께 제출
  const handleSubmitWithFile = async (file: DocumentPicker.DocumentPickerAsset) => {
    if (!selectedDoc) return;

    setIsSubmitting(true);
    try {
      // 데모 모드에서는 상태만 변경
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === selectedDoc.id
              ? { ...doc, status: 'SUBMITTED', submittedAt: new Date().toISOString() }
              : doc
          )
        );
        Alert.alert('제출 완료', '서류가 성공적으로 제출되었습니다.');
        setShowDetailModal(false);
        setSelectedDoc(null);
      }
    } catch (error) {
      Alert.alert('오류', '서류 제출에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 서명 완료 처리
  const handleSignature = (signature: string) => {
    if (!selectedDoc) return;

    setIsSubmitting(true);
    // 데모 모드에서는 상태만 변경
    setTimeout(() => {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === selectedDoc.id
            ? { ...doc, status: 'SUBMITTED', submittedAt: new Date().toISOString() }
            : doc
        )
      );
      setIsSubmitting(false);
      setShowSignatureModal(false);
      setShowDetailModal(false);
      setSelectedDoc(null);
      Alert.alert('서명 완료', '서명이 완료되어 서류가 제출되었습니다.');
    }, 1000);
  };

  // 서명 캔버스 스타일
  const signatureStyle = `.m-signature-pad--footer { display: none; }
    .m-signature-pad { box-shadow: none; border: none; }
    body,html { height: 100%; }
    .m-signature-pad--body { border: none; }`;

  // 필터링된 문서
  const pendingDocs = documents.filter(d => d.status === 'PENDING');
  const completedDocs = documents.filter(d => d.status !== 'PENDING');

  const displayDocs = activeTab === 'pending' ? pendingDocs : completedDocs;

  // 파일 아이콘 반환
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('doc')) return '📘';
    if (fileType.includes('xls')) return '📗';
    return '📄';
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  // 파일 열기
  const handleOpenFile = async (doc: ReceivedDocument) => {
    if (!doc.fileData) {
      Alert.alert('오류', '파일 데이터가 없습니다.');
      return;
    }

    try {
      const fileUri = `${FileSystem.cacheDirectory}${doc.fileName}`;
      const base64Data = doc.fileData.includes(',')
        ? doc.fileData.split(',')[1]
        : doc.fileData;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: doc.fileType,
          dialogTitle: doc.fileName,
        });
      }
    } catch (error) {
      console.error('File open error:', error);
      Alert.alert('오류', '파일을 열 수 없습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>서류함</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            대기 중
          </Text>
          {pendingDocs.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingDocs.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            처리 완료
          </Text>
        </TouchableOpacity>
      </View>

      {/* 문서 목록 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayDocs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'pending' ? '대기 중인 서류가 없습니다' : '처리된 서류가 없습니다'}
            </Text>
          </View>
        ) : (
          displayDocs.map(doc => (
            <TouchableOpacity
              key={doc.id}
              style={styles.docCard}
              onPress={() => {
                setSelectedDoc(doc);
                setShowDetailModal(true);
              }}
            >
              <View style={styles.docCardLeft}>
                <Text style={styles.docIcon}>{getFileIcon(doc.fileType)}</Text>
              </View>
              <View style={styles.docCardContent}>
                <View style={styles.docCardHeader}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: doc.status === 'PENDING' ? '#FEF3C7' :
                      doc.status === 'SUBMITTED' ? '#DBEAFE' :
                      doc.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: doc.status === 'PENDING' ? '#D97706' :
                        doc.status === 'SUBMITTED' ? '#2563EB' :
                        doc.status === 'APPROVED' ? '#059669' : '#DC2626' }
                    ]}>
                      {STATUS_LABELS[doc.status] || doc.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.docCategory}>{CATEGORY_LABELS[doc.category] || doc.category}</Text>
                <View style={styles.docFooter}>
                  <Text style={styles.docDate}>
                    {doc.status === 'PENDING' ? `수신일: ${formatDate(doc.receivedAt)}` :
                      doc.submittedAt ? `제출일: ${formatDate(doc.submittedAt)}` : formatDate(doc.receivedAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.docCardRight}>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* 상세보기 모달 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text style={styles.modalClose}>닫기</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>서류 상세</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedDoc && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.docDetailHeader}>
                <Text style={styles.docDetailIcon}>{getFileIcon(selectedDoc.fileType)}</Text>
                <Text style={styles.docDetailTitle}>{selectedDoc.title}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: selectedDoc.status === 'PENDING' ? '#FEF3C7' :
                    selectedDoc.status === 'SUBMITTED' ? '#DBEAFE' : '#D1FAE5' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: selectedDoc.status === 'PENDING' ? '#D97706' :
                      selectedDoc.status === 'SUBMITTED' ? '#2563EB' : '#059669' }
                  ]}>
                    {STATUS_LABELS[selectedDoc.status]}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>카테고리</Text>
                  <Text style={styles.infoValue}>{CATEGORY_LABELS[selectedDoc.category]}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>파일명</Text>
                  <Text style={styles.infoValue}>{selectedDoc.fileName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>수신일</Text>
                  <Text style={styles.infoValue}>{formatDate(selectedDoc.receivedAt)}</Text>
                </View>
                {selectedDoc.submittedAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>제출일</Text>
                    <Text style={styles.infoValue}>{formatDate(selectedDoc.submittedAt)}</Text>
                  </View>
                )}
              </View>

              {/* 파일 열기 버튼 */}
              <View style={styles.actionSection}>
                <Text style={styles.sectionTitle}>파일 보기</Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.openButton]}
                  onPress={() => handleOpenFile(selectedDoc)}
                >
                  <Text style={styles.openButtonIcon}>📂</Text>
                  <Text style={styles.openButtonText}>파일 열기</Text>
                </TouchableOpacity>
              </View>

              {selectedDoc.status === 'PENDING' && (
                <View style={styles.actionSection}>
                  <Text style={styles.sectionTitle}>서류 제출</Text>
                  <Text style={styles.actionHint}>
                    파일을 수정한 후 업로드하거나 전자 서명으로 제출할 수 있습니다.
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.uploadButton]}
                      onPress={handlePickDocument}
                    >
                      <Text style={styles.uploadButtonIcon}>📎</Text>
                      <Text style={styles.uploadButtonText}>파일 업로드</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.signButton]}
                      onPress={() => setShowSignatureModal(true)}
                    >
                      <Text style={styles.signButtonIcon}>✍️</Text>
                      <Text style={styles.signButtonText}>전자 서명</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* 서명 모달 */}
      <Modal
        visible={showSignatureModal}
        animationType="slide"
        onRequestClose={() => setShowSignatureModal(false)}
      >
        <SafeAreaView style={styles.signatureContainer}>
          <View style={styles.signatureHeader}>
            <TouchableOpacity onPress={() => setShowSignatureModal(false)}>
              <Text style={styles.modalClose}>취소</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>전자 서명</Text>
            <TouchableOpacity onPress={() => signatureRef.current?.clearSignature()}>
              <Text style={styles.clearButton}>지우기</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.signatureArea}>
            <Text style={styles.signatureHint}>아래 영역에 서명해 주세요</Text>
            <View style={styles.signatureCanvas}>
              <SignatureScreen
                ref={signatureRef}
                onOK={handleSignature}
                onEmpty={() => Alert.alert('알림', '서명을 입력해 주세요.')}
                webStyle={signatureStyle}
                backgroundColor="#ffffff"
              />
            </View>
          </View>

          <View style={styles.signatureFooter}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={() => signatureRef.current?.readSignature()}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '제출 중...' : '서명 완료'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#1E293B',
  },
  headerRight: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginRight: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: '#64748B',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  tabBadge: {
    marginLeft: spacing.xs,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: '#94A3B8',
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  docCardLeft: {
    marginRight: spacing.md,
  },
  docIcon: {
    fontSize: 32,
  },
  docCardContent: {
    flex: 1,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  docTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  docCategory: {
    fontSize: fontSize.sm,
    color: '#64748B',
    marginBottom: 4,
  },
  docFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  docDate: {
    fontSize: fontSize.xs,
    color: '#94A3B8',
  },
  dueDate: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  docCardRight: {
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 20,
    color: '#CBD5E1',
  },
  bottomPadding: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalClose: {
    fontSize: fontSize.md,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  docDetailHeader: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  docDetailIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  docDetailTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#1E293B',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: fontSize.md,
    color: '#64748B',
  },
  infoValue: {
    fontSize: fontSize.md,
    color: '#1E293B',
    fontWeight: fontWeight.medium,
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#1E293B',
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: fontSize.md,
    color: '#64748B',
    lineHeight: 22,
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionHint: {
    fontSize: fontSize.sm,
    color: '#94A3B8',
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  openButton: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  openButtonIcon: {
    fontSize: 18,
  },
  openButtonText: {
    fontSize: fontSize.md,
    color: '#FFFFFF',
    fontWeight: fontWeight.medium,
  },
  uploadButton: {
    backgroundColor: '#F1F5F9',
  },
  uploadButtonIcon: {
    fontSize: 18,
  },
  uploadButtonText: {
    fontSize: fontSize.md,
    color: '#475569',
    fontWeight: fontWeight.medium,
  },
  signButton: {
    backgroundColor: colors.primary,
  },
  signButtonIcon: {
    fontSize: 18,
  },
  signButtonText: {
    fontSize: fontSize.md,
    color: '#FFFFFF',
    fontWeight: fontWeight.medium,
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  clearButton: {
    fontSize: fontSize.md,
    color: '#EF4444',
  },
  signatureArea: {
    flex: 1,
    padding: spacing.md,
  },
  signatureHint: {
    fontSize: fontSize.md,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  signatureCanvas: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  signatureFooter: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
