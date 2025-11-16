export const APP_NAME = "Rallio";

export const SKILL_LEVELS = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Beginner+" },
  { value: 3, label: "Intermediate-" },
  { value: 4, label: "Intermediate" },
  { value: 5, label: "Intermediate+" },
  { value: 6, label: "Advanced-" },
  { value: 7, label: "Advanced" },
  { value: 8, label: "Advanced+" },
  { value: 9, label: "Elite-" },
  { value: 10, label: "Elite" },
];

export const PLAY_STYLES = [
  "Casual",
  "Competitive",
  "Singles Only",
  "Doubles Only",
  "Mixed",
];

export const COURT_TYPES = ["Indoor", "Outdoor"];

export const PAYMENT_METHODS = ["GCash", "Maya", "Cash"];

export const DEFAULT_RATING = 1500;

export const QUEUE_STATUSES = {
  OPEN: "open",
  ACTIVE: "active",
  CLOSED: "closed",
} as const;