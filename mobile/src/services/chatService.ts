// Chat message types and API utilities

export interface ChatMessage {
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
    uri?: string;
    data?: string;
  };
  isRead: boolean;
}

const API_BASE = 'http://192.168.254.179:3001/api/chat';

// Get messages for current employee
export async function getMyMessages(employeeId: number): Promise<ChatMessage[]> {
  const url = `${API_BASE}/messages/${employeeId}`;
  console.log('Fetching messages from:', url);
  try {
    const response = await fetch(url);
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching messages:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return [];
  }
}

// Send a message
export async function sendMessage(
  message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>
): Promise<ChatMessage | null> {
  try {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

// Mark messages as read
export async function markMessagesAsRead(employeeId: number): Promise<void> {
  try {
    await fetch(`${API_BASE}/messages/${employeeId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readerType: 'EMPLOYEE' }),
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Get unread count
export async function getUnreadCount(employeeId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/messages/${employeeId}/unread?readerType=EMPLOYEE`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Initialize demo messages - now handled by backend
export async function initDemoMessages(_employeeId: number, _employeeName: string): Promise<void> {
  // Demo data is initialized on the backend
}

// No longer needed with API
export async function simulateAdminResponse(_employeeId: number): Promise<void> {
  // Responses are handled by the admin
}

// For backward compatibility
export async function getAllMessages(): Promise<ChatMessage[]> {
  return [];
}

export async function clearAllMessages(): Promise<void> {
  // Not supported with API
}
