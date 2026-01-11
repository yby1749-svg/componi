import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import {
  ChatMessage,
  getMyMessages,
  sendMessage,
  initDemoMessages,
  markMessagesAsRead,
} from '../services/chatService';
import {
  saveReceivedDocument,
  documentExists,
} from '../services/documentService';

export const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    uri: string;
    type: string;
    size: number;
  } | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevAdminMsgCountRef = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 김영희 = ID 1 (매칭 admin demo data)
  const employeeId = 1;
  const employeeName = user?.name || '김영희';

  // 알림음 재생
  const playNotificationSound = useCallback(async () => {
    try {
      // 진동
      Vibration.vibrate(200);

      // 사운드 재생
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3' },
          { shouldPlay: true }
        );
        soundRef.current = sound;
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    await initDemoMessages(employeeId, employeeName);
    const msgs = await getMyMessages(employeeId);
    setMessages(msgs);
    prevAdminMsgCountRef.current = msgs.filter(m => m.senderType === 'ADMIN').length;
    await markMessagesAsRead(employeeId);
    setLoading(false);
  }, [employeeId, employeeName]);

  useEffect(() => {
    loadMessages();

    // Poll for new messages
    const interval = setInterval(async () => {
      const msgs = await getMyMessages(employeeId);

      // 새 메시지 감지 (인사팀이 보낸 메시지만)
      const adminMsgs = msgs.filter(m => m.senderType === 'ADMIN');
      if (adminMsgs.length > prevAdminMsgCountRef.current) {
        playNotificationSound();

        // Save new file messages to document box
        const newAdminMsgs = adminMsgs.slice(prevAdminMsgCountRef.current);
        for (const msg of newAdminMsgs) {
          if (msg.type === 'FILE' && msg.file) {
            const exists = await documentExists(msg.file.name);
            if (!exists) {
              await saveReceivedDocument({
                title: msg.file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                category: msg.file.name.includes('이력서') ? 'RESUME' :
                          msg.file.name.includes('계약') ? 'CONTRACT' :
                          msg.file.name.includes('증명') ? 'CERTIFICATE' : 'OTHER',
                fileName: msg.file.name,
                fileType: msg.file.type,
                fileData: msg.file.data,
                fileSize: msg.file.size,
                fromAdmin: true,
              });
              console.log('Document saved to 서류함:', msg.file.name);
            }
          }
        }
      }
      prevAdminMsgCountRef.current = adminMsgs.length;

      setMessages(msgs);
    }, 2000);

    return () => {
      clearInterval(interval);
      // Cleanup sound
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [loadMessages, employeeId, playNotificationSound]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachedFile) return;

    setSending(true);

    try {
      if (attachedFile) {
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(attachedFile.uri, {
          encoding: 'base64',
        });

        await sendMessage({
          senderId: String(employeeId),
          senderName: employeeName,
          senderType: 'EMPLOYEE',
          recipientId: employeeId,
          content: newMessage.trim() || `${attachedFile.name} 파일을 전송했습니다.`,
          type: 'FILE',
          file: {
            name: attachedFile.name,
            type: attachedFile.type,
            size: attachedFile.size,
            data: base64,
          },
        });
      } else {
        await sendMessage({
          senderId: String(employeeId),
          senderName: employeeName,
          senderType: 'EMPLOYEE',
          recipientId: employeeId,
          content: newMessage.trim(),
          type: 'TEXT',
        });
      }

      setNewMessage('');
      setAttachedFile(null);

      // Reload messages
      const msgs = await getMyMessages(employeeId);
      setMessages(msgs);
    } catch (error) {
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setAttachedFile({
          name: file.name,
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          size: file.size || 0,
        });
      }
    } catch (error) {
      Alert.alert('오류', '파일을 선택할 수 없습니다.');
    }
  };

  // 파일 다운로드 및 열기
  const handleDownloadFile = async (file: ChatMessage['file']) => {
    console.log('=== handleDownloadFile called ===');
    console.log('File object:', file ? JSON.stringify({name: file.name, type: file.type, dataLength: file.data?.length || 0}) : 'null');

    if (!file) {
      console.log('ERROR: file is null/undefined');
      Alert.alert('오류', '파일 정보가 없습니다.');
      return;
    }

    if (!file.data || file.data.length === 0) {
      console.log('ERROR: file.data is empty or undefined');
      Alert.alert(
        '파일 없음',
        '파일 데이터가 없습니다.\n\n인사팀에서 실제 파일을 업로드한 후 다시 전송해달라고 요청해주세요.',
        [{ text: '확인' }]
      );
      return;
    }

    try {
      // 파일을 캐시 디렉토리에 저장
      const fileUri = `${FileSystem.cacheDirectory}${file.name}`;

      // Strip data URL prefix if present (e.g., "data:application/pdf;base64,")
      const base64Data = file.data.includes(',')
        ? file.data.split(',')[1]
        : file.data;

      console.log('Opening file:', file.name);
      console.log('File data length:', file.data.length);
      console.log('Base64 data length (after strip):', base64Data.length);
      console.log('First 30 chars:', base64Data.substring(0, 30));

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      console.log('File saved to:', fileUri);

      // Open file directly for viewing/editing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: file.type,
          dialogTitle: file.name,
        });
      }

      // After returning from share sheet, show tip about sending back
      setTimeout(() => {
        Alert.alert(
          '파일 수정 후 제출',
          '파일을 수정한 후 아래의 📎 버튼을 눌러 수정된 파일을 첨부하고 전송하세요.',
          [{ text: '확인' }]
        );
      }, 500);
    } catch (error) {
      console.error('File download error:', error);
      Alert.alert('오류', '파일을 열 수 없습니다: ' + (error as Error).message);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderType === 'EMPLOYEE';

    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        {!isMyMessage && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>HR</Text>
            </View>
          </View>
        )}
        <View style={styles.messageContent}>
          {!isMyMessage && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            {item.type === 'FILE' && item.file && (
              <TouchableOpacity
                onPress={() => handleDownloadFile(item.file)}
                style={[
                  styles.fileAttachment,
                  isMyMessage ? styles.myFileAttachment : styles.otherFileAttachment,
                ]}
              >
                <Text style={styles.fileIcon}>📎</Text>
                <Text
                  style={[
                    styles.fileName,
                    isMyMessage ? styles.myFileName : styles.otherFileName,
                  ]}
                  numberOfLines={1}
                >
                  {item.file.name}
                </Text>
                <View style={[styles.downloadButton, isMyMessage ? styles.myDownloadButton : styles.otherDownloadButton]}>
                  <Text style={[styles.downloadText, isMyMessage ? styles.myDownloadText : styles.otherDownloadText]}>열기</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.timestamp, isMyMessage && styles.myTimestamp]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>인사팀 채팅</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>인사팀</Text>
          <Text style={styles.headerSubtitle}>컴포니 주식회사</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>인사팀과 대화를 시작하세요</Text>
              <Text style={styles.emptySubtext}>
                문의사항이나 서류 제출이 필요하시면{'\n'}메시지를 보내주세요
              </Text>
            </View>
          }
        />

        {/* Attached File Preview */}
        {attachedFile && (
          <View style={styles.attachedFileContainer}>
            <View style={styles.attachedFileInfo}>
              <Text style={styles.attachedFileIcon}>📎</Text>
              <Text style={styles.attachedFileName} numberOfLines={1}>
                {attachedFile.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => setAttachedFile(null)}
            >
              <Text style={styles.removeFileText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handlePickDocument}
          >
            <Text style={styles.attachButtonText}>📎</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() && !attachedFile) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={sending || (!newMessage.trim() && !attachedFile)}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.sendButtonText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginRight: spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  messageContent: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  myMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  myMessageText: {
    color: colors.surface,
  },
  otherMessageText: {
    color: colors.textPrimary,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  myFileAttachment: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  otherFileAttachment: {
    backgroundColor: colors.background,
  },
  fileIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  fileName: {
    fontSize: fontSize.xs,
    flex: 1,
  },
  myFileName: {
    color: colors.surface,
  },
  otherFileName: {
    color: colors.textSecondary,
  },
  downloadButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  myDownloadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  otherDownloadButton: {
    backgroundColor: colors.primary,
  },
  downloadText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  myDownloadText: {
    color: colors.surface,
  },
  otherDownloadText: {
    color: colors.surface,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  myTimestamp: {
    textAlign: 'right',
    marginRight: 4,
    marginLeft: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  attachedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  attachedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachedFileIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  attachedFileName: {
    fontSize: fontSize.sm,
    color: colors.primary,
    flex: 1,
  },
  removeFileButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeFileText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButtonText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    maxHeight: 100,
    marginHorizontal: spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.surface,
    fontWeight: fontWeight.bold,
  },
});
