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
    data: string;
  };
  isRead: boolean;
}

const API_BASE = 'http://localhost:3001/api/chat';

// Get messages for specific employee
export async function getMessagesByEmployee(employeeId: number): Promise<ChatMessage[]> {
  try {
    const response = await fetch(`${API_BASE}/messages/${employeeId}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

// Send a new message
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
      body: JSON.stringify({ readerType: 'ADMIN' }),
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

// Get unread count for an employee
export async function getUnreadCount(employeeId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/messages/${employeeId}/unread?readerType=ADMIN`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// These functions are no longer needed with API but kept for compatibility
export function initDemoChatMessages(_employeeId: number, _employeeName: string): void {
  // Demo data is initialized on the backend
}

export function simulateEmployeeResponse(_employeeId: number, _employeeName: string): void {
  // Responses are handled by the mobile app
}
