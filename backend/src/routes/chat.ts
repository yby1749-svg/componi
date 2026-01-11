import express from 'express';

const router = express.Router();

// In-memory storage for chat messages (demo purposes)
interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'ADMIN' | 'EMPLOYEE';
  recipientId: number;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'FILE';
  file?: {
    name: string;
    type: string;
    size: number;
    data: string;
  };
  isRead: boolean;
}

// Store messages in memory (will reset on server restart)
let messages: ChatMessage[] = [];

// Initialize with demo messages
const initDemoMessages = () => {
  if (messages.length === 0) {
    messages = [
      {
        id: 'msg-demo-1',
        senderId: 'admin',
        senderName: '인사팀',
        senderType: 'ADMIN',
        recipientId: 1,
        content: '안녕하세요, 김영희님. 인사팀입니다.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'TEXT',
        isRead: true,
      },
      {
        id: 'msg-demo-2',
        senderId: '1',
        senderName: '김영희',
        senderType: 'EMPLOYEE',
        recipientId: 1,
        content: '안녕하세요! 네, 무엇이 필요하신가요?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        type: 'TEXT',
        isRead: true,
      },
      {
        id: 'msg-demo-3',
        senderId: 'admin',
        senderName: '인사팀',
        senderType: 'ADMIN',
        recipientId: 1,
        content: '2024년 근로계약서 갱신 관련 서류 요청드립니다.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        type: 'TEXT',
        isRead: true,
      },
    ];
  }
};

initDemoMessages();

// Get all messages for an employee
router.get('/messages/:employeeId', (req, res) => {
  const employeeId = parseInt(req.params.employeeId);
  const employeeMessages = messages
    .filter(m => m.recipientId === employeeId || m.senderId === String(employeeId))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  res.json(employeeMessages);
});

// Send a new message
router.post('/messages', (req, res) => {
  const { senderId, senderName, senderType, recipientId, content, type, file } = req.body;

  const newMessage: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    senderId,
    senderName,
    senderType,
    recipientId,
    content,
    timestamp: new Date().toISOString(),
    type: type || 'TEXT',
    file,
    isRead: false,
  };

  messages.push(newMessage);
  res.status(201).json(newMessage);
});

// Mark messages as read
router.put('/messages/:employeeId/read', (req, res) => {
  const employeeId = parseInt(req.params.employeeId);
  const { readerType } = req.body; // 'ADMIN' or 'EMPLOYEE'

  messages = messages.map(m => {
    if (readerType === 'ADMIN' && m.senderType === 'EMPLOYEE' && m.senderId === String(employeeId)) {
      return { ...m, isRead: true };
    }
    if (readerType === 'EMPLOYEE' && m.senderType === 'ADMIN' && m.recipientId === employeeId) {
      return { ...m, isRead: true };
    }
    return m;
  });

  res.json({ success: true });
});

// Get unread count for an employee
router.get('/messages/:employeeId/unread', (req, res) => {
  const employeeId = parseInt(req.params.employeeId);
  const { readerType } = req.query;

  let count = 0;
  if (readerType === 'ADMIN') {
    count = messages.filter(
      m => m.senderType === 'EMPLOYEE' && m.senderId === String(employeeId) && !m.isRead
    ).length;
  } else {
    count = messages.filter(
      m => m.senderType === 'ADMIN' && m.recipientId === employeeId && !m.isRead
    ).length;
  }

  res.json({ count });
});

export default router;
