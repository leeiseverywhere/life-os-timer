"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { CalendarEvent } from "@/lib/calendar-types";
import EventList from "./EventList";
import Timer from "./Timer";
import Toast from "./Toast";

type View = "events" | "timer";

export default function Dashboard() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>("events");
  const [toast, setToast] = useState({ visible: false, message: "" });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 오늘 일정에서 이벤트 선택 → 타이머 탭으로 이동
  const handleSelectFromList = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setView("timer");
  };

  // 오늘 일정에서 이벤트 선택 해제 (토글)
  const handleToggleFromList = (event: CalendarEvent | null) => {
    if (!event) {
      setSelectedEvent(null);
      return;
    }
    if (event.id === selectedEvent?.id) {
      setSelectedEvent(null); // 선택 해제
    } else {
      setSelectedEvent(event);
      setView("timer");
    }
  };

  // 타이머에서 이벤트 선택/해제
  const handleSelectFromTimer = (event: CalendarEvent | null) => {
    setSelectedEvent(event);
  };

  // 타이머 완료 → 오늘 일정 탭으로 이동 + 토스트
  const handleTimerComplete = () => {
    setSelectedEvent(null);
    fetchEvents();
    setToast({ visible: true, message: "✓ 활동이 Google Calendar에 기록되었습니다" });
    // 잠깐 딜레이 후 탭 이동 (토스트 보이게)
    setTimeout(() => setView("events"), 800);
  };

  const handleTimerClear = () => {
    setSelectedEvent(null);
    setView("events");
  };

  // 통계
  const plans    = events.filter((e) => !e.colorId || e.colorId === "8");
  const completed = events.filter((e) => e.colorId === "9");
  const external  = events.filter((e) => e.colorId === "11");

  const dateStr = new Date().toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
  });

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Life OS</h1>
            <p className="text-xs text-gray-400">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
            )}
            <button
              onClick={() => signOut()}
              className="rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {!loading && (plans.length + completed.length) > 0 && (
        <div className="border-b border-gray-100">
          <div className="mx-auto max-w-lg px-5 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">오늘의 진행률</span>
              <span className="font-medium text-gray-900">
                {completed.length}/{plans.length + completed.length}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-700"
                style={{
                  width: `${(completed.length / (plans.length + completed.length)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex max-w-lg">
          {(["events", "timer"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                view === v
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {v === "events" ? "오늘 일정" : "타이머"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
          </div>
        ) : view === "events" ? (
          <EventList
            events={events}
            onSelectEvent={handleToggleFromList}
            activeEventId={selectedEvent?.id}
            onRefresh={fetchEvents}
          />
        ) : (
          <Timer
            selectedEvent={selectedEvent}
            events={events}
            onComplete={handleTimerComplete}
            onClear={handleTimerClear}
            onSelectEvent={handleSelectFromTimer}
          />
        )}
      </main>

      {/* Bottom bar (오늘 일정 탭) */}
      {view === "events" && !loading && (
        <div className="sticky bottom-0 border-t border-gray-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-3">
            <div className="flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
                계획 {plans.length}
              </span>
              <span className="flex items-center gap-1 text-blue-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                완료 {completed.length}
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                약속 {external.length}
              </span>
            </div>
            <button
              onClick={() => { setSelectedEvent(null); setView("timer"); }}
              className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800 active:scale-[0.97]"
            >
              + 새 활동
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: "" })}
      />
    </div>
  );
}
