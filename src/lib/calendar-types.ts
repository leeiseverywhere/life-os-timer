// Shared types and constants — safe for client components

export const GCAL_COLORS = {
  PLAN: "8",
  EXTERNAL: "11",
  DONE: "9",
  SLEEP: "3",
} as const;

export const COLOR_LABELS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  "8":  { label: "계획", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  "11": { label: "외부 약속", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  "9":  { label: "완료", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "3":  { label: "수면", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

export const CATEGORIES = [
  { id: "earn", emoji: "💰", label: "Earn", examples: "주식 강의, 갤러리 작업" },
  { id: "build", emoji: "🌱", label: "Build", examples: "바이올린, 독서, 스페인어" },
  { id: "live", emoji: "🏃", label: "Live", examples: "운동, 식사, 건강 관리" },
  { id: "connect", emoji: "🤝", label: "Connect", examples: "소셜 약속, 브랜딩" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  colorId?: string;
  description?: string;
  category?: CategoryId;
}
