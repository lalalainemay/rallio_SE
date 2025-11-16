// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  profileCompleted: boolean;
}

export interface Player {
  id: string;
  userId: string;
  birthDate?: string;
  gender?: "male" | "female" | "other";
  skillLevel: number; // 1-10
  playStyle?: string;
  rating: number;
  createdAt: string;
}

// Court types
export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  createdAt: string;
}

export interface Court {
  id: string;
  venueId: string;
  name: string;
  surfaceType?: string;
  courtType: "indoor" | "outdoor";
  capacity: number;
  hourlyRate: number;
  createdAt: string;
}

// Queue types
export interface QueueSession {
  id: string;
  courtId: string;
  organizerId: string;
  startTime: string;
  endTime: string;
  mode: "casual" | "competitive";
  maxPlayers: number;
  status: "open" | "active" | "closed";
  createdAt: string;
}

export interface QueueParticipant {
  id: string;
  queueSessionId: string;
  userId: string;
  joinedAt: string;
  skillAtJoin: number;
  status: "waiting" | "playing" | "completed";
  paymentStatus: "unpaid" | "paid";
}

// Reservation types
export interface Reservation {
  id: string;
  courtAvailabilityId: string;
  organizerId: string;
  reservedFor: number;
  status: "confirmed" | "cancelled" | "completed";
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}