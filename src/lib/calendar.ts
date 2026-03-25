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
    maxResults: 50,
  });

  return (res.data.items || []).map((event) => ({
    id: event.id!,
    summary: event.summary || "(제목 없음)",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    colorId: event.colorId || undefined,
    description: event.description || undefined,
  }));
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
