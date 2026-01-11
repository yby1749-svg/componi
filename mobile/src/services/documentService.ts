// Document storage service for mobile app
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReceivedDocument {
  id: string;
  title: string;
  category: string;
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  fileName: string;
  fileType: string;
  fileData: string; // Base64
  fileSize: number;
  receivedAt: string;
  submittedAt?: string;
  fromAdmin: boolean;
}

const STORAGE_KEY = 'componi_received_documents';

// Get all received documents
export async function getReceivedDocuments(): Promise<ReceivedDocument[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading documents:', error);
    return [];
  }
}

// Save a received document
export async function saveReceivedDocument(doc: Omit<ReceivedDocument, 'id' | 'receivedAt' | 'status'>): Promise<ReceivedDocument> {
  try {
    const docs = await getReceivedDocuments();
    const newDoc: ReceivedDocument = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receivedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    docs.unshift(newDoc);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    return newDoc;
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
}

// Update document status (when submitted)
export async function updateDocumentStatus(
  docId: string,
  status: ReceivedDocument['status'],
  submittedAt?: string
): Promise<void> {
  try {
    const docs = await getReceivedDocuments();
    const index = docs.findIndex(d => d.id === docId);
    if (index !== -1) {
      docs[index].status = status;
      if (submittedAt) {
        docs[index].submittedAt = submittedAt;
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    }
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

// Delete a document
export async function deleteDocument(docId: string): Promise<void> {
  try {
    const docs = await getReceivedDocuments();
    const filtered = docs.filter(d => d.id !== docId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Check if document already exists (by filename)
export async function documentExists(fileName: string): Promise<boolean> {
  const docs = await getReceivedDocuments();
  return docs.some(d => d.fileName === fileName);
}
