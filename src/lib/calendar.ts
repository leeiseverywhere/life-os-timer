import "server-only";
import { google } from "googleapis";
import { GCAL_COLORS, CATEGORIES, CalendarEvent, CategoryId } from "./calendar-types";

export type { CalendarEvent, CategoryId };
export { GCAL_COLORS, CATEGORIES };

function getCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

// description에서 [category:xxx] 파싱
function parseCategory(description?: string): CategoryId | undefined {
  const m = description?.match(/\[category:(\w+)\]/);
  const id = m?.[1];
  return CATEGORIES.find((c) => c.id === id)?.id;
}

export async function getTodayEvents(accessToken: string): Promise<CalendarEvent[]> {
  const calendar = getCalendarClient(accessToken);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  return (res.data.items || []).map((event) => {
    const isAllDay = !event.start?.dateTime;
    const description = event.description || undefined;
    return {
      id: event.id!,
      summary: event.summary || "(제목 없음)",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      colorId: event.colorId || undefined,
      description,
      category: parseCategory(description),
      isAllDay,
      isTimerDone: description?.includes("[타이머완료]") ?? false,
    };
  });
}

export async function createCompletionEvent(
  accessToken: string,
  title: string,
  startTime: string,
  endTime: string,
  category: CategoryId,
  originalEventId?: string,
) {
  const calendar = getCalendarClient(accessToken);
  const categoryInfo = CATEGORIES.find((c) => c.id === category);
  const description = [
    `[category:${category}]`,
    `[타이머완료]`,
    `카테고리: ${categoryInfo?.emoji} ${categoryInfo?.label}`,
    originalEventId ? `원본 계획: ${originalEventId}` : null,
    "✓ Life OS Timer로 기록됨",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${title} ✓`,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      colorId: GCAL_COLORS.DONE,
      description,
    },
  });

  return res.data;
}

// 사후 기록 (타이머 없이 수동 입력)
export async function createManualRecord(
  accessToken: string,
  title: string,
  startTime: string,
  endTime: string,
  category: CategoryId,
  originalEventId?: string,
) {
  const calendar = getCalendarClient(accessToken);
  const categoryInfo = CATEGORIES.find((c) => c.id === category);
  const description = [
    `[category:${category}]`,
    `카테고리: ${categoryInfo?.emoji} ${categoryInfo?.label}`,
    originalEventId ? `원본 계획: ${originalEventId}` : null,
    "✓ Life OS 사후 기록",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `${title} ✓`,
      start: { dateTime: startTime },
      end: { dateTime: endTime },
      colorId: GCAL_COLORS.DONE,
      description,
    },
  });

  return res.data;
}

// 이벤트 카테고리 변경 (description 태그 업데이트)
export async function updateEventCategory(
  accessToken: string,
  eventId: string,
  category: CategoryId | null,
) {
  const calendar = getCalendarClient(accessToken);
  const existing = await calendar.events.get({ calendarId: "primary", eventId });
  const desc = existing.data.description || "";
  // 기존 [category:xxx] 제거
  const cleaned = desc.replace(/\[category:\w+\]\n?/, "").trim();
  const newDesc = category ? `[category:${category}]\n${cleaned}` : cleaned;

  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: { description: newDesc },
  });
}
