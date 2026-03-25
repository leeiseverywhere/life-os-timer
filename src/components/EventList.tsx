"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarEvent } from "@/lib/calendar-types";

interface EventListProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent | null) => void;
  activeEventId?: string;
}

function formatTime(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// 이벤트 타입별 스타일
function getStyle(colorId?: string, isTimerDone?: boolean) {
  if (isTimerDone) return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", border: "border-blue-100" };
  switch (colorId) {
    case "9":  return { bg: "bg-blue-50",  text: "text-blue-700",  dot: "bg-blue-400",  border: "border-blue-100"  }; // 완료
    case "11": return { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-400",   border: "border-red-100"   }; // 외부약속
    case "3":  return { bg: "bg-purple-50",text: "text-purple-700",dot: "bg-purple-400",border: "border-purple-100"}; // 수면
    case "8":  return { bg: "bg-gray-50",  text: "text-gray-700",  dot: "bg-gray-300",  border: "border-gray-100"  }; // 계획(그레이)
    default:   return { bg: "bg-gray-50",  text: "text-gray-700",  dot: "bg-gray-300",  border: "border-gray-100"  };
  }
}

function isTimerCompleted(event: CalendarEvent) {
  // timerDone 플래그 또는 description에 "[타이머 완료]" 포함
  return event.colorId === "9" && (event.description?.includes("[타이머완료]") ?? false);
}

export default function EventList({ events, onSelectEvent, activeEventId }: EventListProps) {
  const nowLineRef = useRef<HTMLDivElement>(null);
  const [nowPct, setNowPct] = useState<number | null>(null);
  const [, setTick] = useState(0);

  // 1분마다 현재 시간 선 갱신
  useEffect(() => {
    const update = () => setTick((t) => t + 1);
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    nowLineRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 text-4xl">📅</div>
        <p className="text-sm text-gray-400">오늘 일정이 없습니다</p>
      </div>
    );
  }

  // 시간순 정렬 (전체)
  const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  // 오늘 전체 범위 중 현재 시간 위치 (%)
  const dayMs = todayEnd.getTime() - todayStart.getTime();
  const nowMs = now.getTime() - todayStart.getTime();
  const currentPct = Math.min(Math.max((nowMs / dayMs) * 100, 0), 100);

  // 현재 시간이 어떤 이벤트 사이에 들어가는지 인덱스 찾기
  let insertBeforeIdx = sorted.findIndex((e) => new Date(e.start) > now);
  if (insertBeforeIdx === -1) insertBeforeIdx = sorted.length; // 맨 끝

  const handleToggle = (event: CalendarEvent) => {
    if (event.colorId === "9" || event.colorId === "11" || event.colorId === "3") return;
    if (event.id === activeEventId) {
      onSelectEvent(null); // 선택 해제
    } else {
      onSelectEvent(event);
    }
  };

  void nowPct; // suppress unused warning
  void setNowPct;
  void currentPct;

  return (
    <div className="space-y-1.5 pb-4">
      {sorted.map((event, idx) => {
        const style = getStyle(event.colorId);
        const isActive = event.id === activeEventId;
        const isSelectable = !event.colorId || event.colorId === "8";
        const isPast = new Date(event.end) < now;
        const isOngoing = new Date(event.start) <= now && new Date(event.end) >= now;
        const isDone = event.colorId === "9";
        const timerDone = isTimerCompleted(event);

        // 현재 시간 선 삽입
        const showNowLine = idx === insertBeforeIdx;

        return (
          <div key={event.id}>
            {/* 현재 시간 선 */}
            {showNowLine && (
              <div ref={nowLineRef} className="flex items-center gap-2 py-1.5">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-sm shadow-red-200" />
                <div className="flex-1 border-t-2 border-red-400 border-dashed" />
                <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
                  {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
            )}

            <button
              onClick={() => handleToggle(event)}
              disabled={!isSelectable}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                isActive
                  ? "bg-gray-900 text-white ring-2 ring-gray-900"
                  : isOngoing
                  ? `${style.bg} ring-2 ring-green-200`
                  : isPast && !isDone
                  ? `${style.bg} opacity-50`
                  : `${style.bg} ${isSelectable ? "hover:ring-2 hover:ring-gray-200 active:scale-[0.99]" : "cursor-default"}`
              }`}
            >
              {/* 왼쪽 dot */}
              <div className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-white" : style.dot}`} />

              {/* 텍스트 */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isActive ? "text-white" : style.text}`}>
                  {event.summary}
                </p>
                <p className={`text-xs ${isActive ? "text-gray-300" : "text-gray-400"}`}>
                  {formatTime(event.start)} – {formatTime(event.end)}
                  {isOngoing && <span className="ml-1.5 font-medium text-green-500">진행 중</span>}
                </p>
              </div>

              {/* 오른쪽 상태 배지 */}
              <div className="flex shrink-0 items-center gap-1.5">
                {isDone && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    완료
                    {timerDone && <span className="ml-0.5">⏱</span>}
                  </span>
                )}
                {isActive && (
                  <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSelectable && !isActive && !isDone && (
                  <svg className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        );
      })}

      {/* 현재 시간이 모든 이벤트 이후일 때 */}
      {insertBeforeIdx === sorted.length && (
        <div ref={nowLineRef} className="flex items-center gap-2 py-1.5">
          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-sm shadow-red-200" />
          <div className="flex-1 border-t-2 border-red-400 border-dashed" />
          <span className="shrink-0 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-500">
            {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </span>
        </div>
      )}
    </div>
  );
}
