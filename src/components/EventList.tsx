"use client";

import { CalendarEvent, COLOR_LABELS } from "@/lib/calendar-types";

interface EventListProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  activeEventId?: string;
}

function formatTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getEventStyle(colorId?: string) {
  const color = COLOR_LABELS[colorId || ""] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-300" };
  return color;
}

export default function EventList({ events, onSelectEvent, activeEventId }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 text-4xl">📅</div>
        <p className="text-sm text-gray-400">오늘 일정이 없습니다</p>
      </div>
    );
  }

  // Group: plans (gray/no color), external (red), completed (blue), sleep (purple)
  const plans = events.filter((e) => !e.colorId || e.colorId === "8");
  const external = events.filter((e) => e.colorId === "11");
  const completed = events.filter((e) => e.colorId === "9");
  const sleep = events.filter((e) => e.colorId === "3");

  const sections = [
    { title: "계획", events: plans, showSelect: true },
    { title: "외부 약속", events: external, showSelect: false },
    { title: "완료", events: completed, showSelect: false },
    { title: "수면", events: sleep, showSelect: false },
  ].filter((s) => s.events.length > 0);

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            {section.title}
            <span className="ml-1.5 text-gray-300">{section.events.length}</span>
          </h3>
          <div className="space-y-1.5">
            {section.events.map((event) => {
              const style = getEventStyle(event.colorId);
              const isActive = event.id === activeEventId;
              return (
                <button
                  key={event.id}
                  onClick={() => section.showSelect && onSelectEvent(event)}
                  disabled={!section.showSelect}
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    isActive
                      ? "bg-gray-900 text-white ring-2 ring-gray-900"
                      : section.showSelect
                        ? `${style.bg} hover:ring-2 hover:ring-gray-200 active:scale-[0.98]`
                        : `${style.bg} cursor-default opacity-75`
                  }`}
                >
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-white" : style.dot}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${isActive ? "text-white" : style.text}`}
                    >
                      {event.summary}
                    </p>
                    <p className={`text-xs ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                      {formatTime(event.start)} – {formatTime(event.end)}
                    </p>
                  </div>
                  {section.showSelect && !isActive && (
                    <svg
                      className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
