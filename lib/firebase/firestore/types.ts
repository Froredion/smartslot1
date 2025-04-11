import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  organizationIds: string[];
  pendingInvites: Array<{
    organizationId: string;
    organizationName: string;
    invitedBy: string;
    invitedAt: Date;
  }>;
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    currency: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  currency: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'Available' | 'Unavailable';
  pricePerDay: number;
  agentFee: number;
  currency: string;
  bookingType: 'full-day' | 'time-slots';
  timeSlots?: TimeSlot[];
  maxBookingsPerDay?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  assetId: string;
  date: Date;
  description?: string;
  bookedBy: string;
  clientName?: string;
  numberOfPeople?: number;
  customPrice?: number;
  customAgentFee?: number;
  currency: string;
  timeSlot?: TimeSlot;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalEarned: number;
  unpaidAmount: number;
  agentPayments: number;
  currency: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  resourceType: string;
  details: string;
  timestamp: {
    toDate: () => Date;
  };
}

export interface UserPermissions {
  analytics: {
    viewEarnings: boolean;
    viewUnpaidAmount: boolean;
    viewAgentPayments: boolean;
  };
  bookings: {
    create: boolean;
    createForOthers: boolean;
    edit: boolean;
    editOthers: boolean;
    delete: boolean;
    deleteOthers: boolean;
  };
  users: {
    manage: boolean;
  };
}

export interface OrganizationInvite {
  id: string;
  organizationId: string;
  organizationName: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  email?: string;
  userId?: string;
}

export interface PendingInvite {
  organizationId: string;
  organizationName: string;
  invitedBy: string;
  invitedAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface PendingInviteDocument {
  invites: PendingInvite[];
  createdAt: Date;
  updatedAt: Date;
} 