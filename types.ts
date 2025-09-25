import firebase from 'firebase/compat/app';

// Describes the listener's availability for taking new calls/chats.
export type ListenerAppStatus = 'Available' | 'Busy' | 'Offline' | 'Break';

// Describes the listener's account status in the system (e.g., pending approval, active).
export type ListenerAccountStatus = 'onboarding_required' | 'pending' | 'active' | 'suspended' | 'rejected';

// The main profile for a listener.
export interface ListenerProfile {
  uid: string;
  displayName: string; // Public name shown to users
  realName: string; // For admin and payment purposes
  phone: string;
  status: ListenerAccountStatus; // Account status
  appStatus: ListenerAppStatus; // Live availability status
  createdAt: firebase.firestore.Timestamp;
  onboardingComplete: boolean;
  isAdmin: boolean;
  profession: string;
  languages: string[];
  avatarUrl: string;
  city: string;
  age: number;
  bankAccount?: string | null;
  ifsc?: string | null;
  bankName?: string | null;
  upiId?: string | null;
  notificationSettings?: {
    calls?: boolean;
    messages?: boolean;
  };
  fcmTokens?: string[];
  
  // Aggregated Stats
  totalEarnings?: number;
  totalCalls?: number; // Legacy, replaced by callsCompleted
  callsCompleted?: number;
  chatsCompleted?: number;
  totalMinutes?: number;
  totalMessages?: number;

  // Performance Metrics
  rating?: number;
  responseTime?: string;
  averagePerMinuteEarning?: number;
  averagePerMessageEarning?: number;
  dailyEarnings?: { [key: string]: number };
  
  // Real-time Presence - DEPRECATED in favor of appStatus
  approvedBy?: string;
}

// Represents a single call record in the history.
export interface CallRecord {
  callId: string;
  listenerId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  startTime: firebase.firestore.Timestamp;
  endTime?: firebase.firestore.Timestamp;
  durationSeconds?: number;
  status: 'pending' | 'ringing' | 'active' | 'completed' | 'missed' | 'rejected' | 'cancelled';
  earnings?: number;
  type?: 'call'; // for activity feed
  bonusAwarded?: boolean; // To track if a follow-up bonus was given
}

// Represents a chat session between a listener and a user.
export interface ListenerChatSession {
    id: string; // document ID
    listenerId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    lastMessageText: string;
    lastMessageTimestamp: firebase.firestore.Timestamp;
    unreadByListener: boolean;
}

// Represents a single message within a chat.
export type ChatMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export interface ChatMessage {
    id: string;
    senderId: string; // either listener's UID or user's UID
    text: string;
    timestamp: firebase.firestore.Timestamp;
    status: ChatMessageStatus;
    type: 'text' | 'audio' | 'info';
    audioUrl?: string;
    duration?: number; // for audio messages in seconds
}

// Represents a single earning transaction for a listener.
export interface EarningRecord {
    id: string;
    amount: number;
    timestamp: firebase.firestore.Timestamp;
    type: 'call' | 'chat_session' | 'bonus'; // Source of the earning
    sourceId: string; // callId or chatId
    userName: string;
}

// Represents a new listener application.
export interface Application {
    id: string;
    fullName: string;
    displayName: string;
    phone: string;
    profession: string;
    languages: string[];
    bankAccount?: string;
    ifsc?: string;
    bankName?: string;
    upiId?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: firebase.firestore.Timestamp;
    reason?: string;
    listenerUid?: string;
}