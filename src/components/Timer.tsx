"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarEvent, CategoryId } from "@/lib/calendar-types";
import CategoryPicker from "./CategoryPicker";

type TimerState = "idle" | "running" | "paused" | "completing";

interface TimerProps {
  selectedEvent: CalendarEvent | null;
  events: CalendarEvent[];
  onComplete: () => void;
  onClear: () => void;
  onSelectEvent: (event: CalendarEvent | null) => void;
}

export default function Timer({ selectedEvent, events, onComplete, onClear, onSelectEvent }: TimerProps) {
  const [state, setState] = useState<TimerState>("idle");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedElapsedRef = useRef(0);
  const resumeTimeRef = useRef<Date | null>(null);

  const title = selectedEvent?.summary || customTitle;
  const hasActivity = !!(selectedEvent || customTitle);

  // 계획 이벤트만 (미완료)
  const planEvents = events.filter((e) => !e.colorId || e.colorId === "8");

  // 현재 시간 기준 주변 이벤트 (앞뒤 2~3시간)
  const now = new Date();
  const nearbyEvents = planEvents
    .filter((e) => {
      const start = new Date(e.start);
      const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= -2 && diffHours <= 3;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // 검색 필터
  const filteredEvents = searchQuery.length > 0
    ? planEvents
        .filter((e) => e.summary.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    : nearbyEvents;

  // Timer tick
  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        if (resumeTimeRef.current) {
          const diff = Math.floor((Date.now() - resumeTimeRef.current.getTime()) / 1000);
          setElapsed(pausedElapsedRef.current + diff);
        }
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStart = useCallback(() => {
    if (!category || !hasActivity) return;
    const n = new Date();
    setStartTime(n);
    resumeTimeRef.current = n;
    pausedElapsedRef.current = 0;
    setElapsed(0);
    setState("running");
  }, [category, hasActivity]);

  const handlePause = () => {
    pausedElapsedRef.current = elapsed;
    resumeTimeRef.current = null;
    setState("paused");
  };

  const handleResume = () => {
    resumeTimeRef.current = new Date();
    setState("running");
  };

  const handleComplete = async () => {
    if (!startTime || !category) return;
    setState("completing");
    const endTime = new Date();
    try {
      const res = await fetch("/api/events/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          category,
          originalEventId: selectedEvent?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      doReset();
      onComplete();
    } catch {
      setState("paused");
    }
  };

  const doReset = () => {
    setState("idle");
    setCategory(null);
    setElapsed(0);
    setStartTime(null);
    setCustomTitle("");
    setSearchQuery("");
    pausedElapsedRef.current = 0;
    resumeTimeRef.current = null;
  };

  const handleReset = () => {
    doReset();
    onSelectEvent(null);
    onClear();
  };

  const handlePickEvent = (event: CalendarEvent) => {
    onSelectEvent(event);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleConfirmCustom = () => {
    if (searchQuery.trim()) {
      setCustomTitle(searchQuery.trim());
      setSearchQuery("");
      setShowDropdown(false);
    }
  };

  // ── 타이머 실행 중 / 완료 중 ─────────────────────────────────────
  if (state === "running" || state === "paused" || state === "completing") {
    return (
      <div className="space-y-6 pt-2">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
        </div>
        <div className="text-center">
          <p className="font-mono text-7xl font-light tabular-nums tracking-tight text-gray-900">
            {formatTime(elapsed)}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {startTime?.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })} 시작
          </p>
        </div>
        <div className="flex gap-3">
          {state === "running" && (
            <button onClick={handlePause} className="flex-1 rounded-xl bg-gray-100 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-200 active:scale-[0.98] transition-all">
              일시정지
            </button>
          )}
          {state === "paused" && (
            <button onClick={handleResume} className="flex-1 rounded-xl bg-gray-900 py-4 text-sm font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all">
              재개
            </button>
          )}
          <button
            onClick={handleComplete}
            disabled={state === "completing"}
            className={`flex-1 rounded-xl py-4 text-sm font-semibold transition-all active:scale-[0.98] ${
              state === "completing" ? "cursor-wait bg-blue-100 text-blue-400" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {state === "completing" ? "저장 중..." : "완료 ✓"}
          </button>
        </div>
        <button onClick={handleReset} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
          초기화
        </button>
      </div>
    );
  }

  // ── Idle: 이벤트 선택 + 카테고리 + 시작 ──────────────────────────
  return (
    <div className="space-y-5">
      {/* 큰 타이머 (비활성 상태) */}
      <div className="text-center py-2">
        <p className={`font-mono text-7xl font-light tabular-nums tracking-tight transition-colors duration-300 ${
          hasActivity && category ? "text-gray-900" : "text-gray-200"
        }`}>
          00:00
        </p>
        {!hasActivity && (
          <p className="mt-2 text-xs text-gray-400">일정을 선택하거나 직접 입력하세요</p>
        )}
        {hasActivity && !category && (
          <p className="mt-2 text-xs text-gray-400">카테고리를 선택하면 시작할 수 있어요</p>
        )}
      </div>

      {/* 선택된 이벤트 칩 */}
      {selectedEvent ? (
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{selectedEvent.summary}</p>
            <p className="text-xs text-gray-400">
              {new Date(selectedEvent.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              {" – "}
              {new Date(selectedEvent.end).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          </div>
          <button
            onClick={() => { onSelectEvent(null); setSearchQuery(""); }}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : customTitle ? (
        /* 직접 입력 타이틀 칩 */
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <p className="truncate text-sm font-medium text-gray-900">{customTitle}</p>
          <button
            onClick={() => setCustomTitle("")}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        /* 검색 입력 + 드롭다운 */
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="일정 검색 또는 새 활동 직접 입력..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
          {searchQuery ? (
            <button
              onMouseDown={(e) => { e.preventDefault(); setSearchQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          )}

          {/* 드롭다운 */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
              {filteredEvents.length > 0 && (
                <>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    {searchQuery ? "검색 결과" : "현재 시간 주변 일정"}
                  </p>
                  {filteredEvents.map((event) => {
                    const s = new Date(event.start);
                    const e = new Date(event.end);
                    const isOngoing = s <= now && e >= now;
                    return (
                      <button
                        key={event.id}
                        onMouseDown={() => handlePickEvent(event)}
                        className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-2.5 text-left last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOngoing ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{event.summary}</p>
                          <p className="text-xs text-gray-400">
                            {s.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            {" – "}
                            {e.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            {isOngoing && <span className="ml-1.5 text-green-500">진행 중</span>}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
              {searchQuery && (
                <button
                  onMouseDown={handleConfirmCustom}
                  className="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">+</span>
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">&ldquo;{searchQuery}&rdquo;</span> 직접 입력으로 시작
                  </span>
                </button>
              )}
              {!searchQuery && filteredEvents.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-400">현재 시간 주변 일정이 없어요</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 주변 이벤트 빠른 선택 (드롭다운 닫혔을 때) */}
      {!hasActivity && !showDropdown && nearbyEvents.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-gray-400">지금 주변 일정</p>
          <div className="space-y-1.5">
            {nearbyEvents.slice(0, 4).map((event) => {
              const s = new Date(event.start);
              const e = new Date(event.end);
              const isOngoing = s <= now && e >= now;
              return (
                <button
                  key={event.id}
                  onClick={() => handlePickEvent(event)}
                  className="flex w-full items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-left hover:bg-gray-100 transition-colors active:scale-[0.99]"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${isOngoing ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{event.summary}</p>
                    <p className="text-xs text-gray-400">
                      {s.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      {" – "}
                      {e.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      {isOngoing && <span className="ml-1.5 font-medium text-green-500">진행 중</span>}
                    </p>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 카테고리 선택 (이벤트/타이틀 확정 후) */}
      {hasActivity && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">카테고리</p>
          <CategoryPicker selected={category} onSelect={setCategory} />
        </div>
      )}

      {/* 타이머 시작 버튼 */}
      <button
        onClick={handleStart}
        disabled={!hasActivity || !category}
        className={`w-full rounded-xl py-4 text-sm font-semibold transition-all active:scale-[0.98] ${
          hasActivity && category
            ? "bg-gray-900 text-white hover:bg-gray-800"
            : "cursor-not-allowed bg-gray-100 text-gray-300"
        }`}
      >
        타이머 시작
      </button>
    </div>
  );
}
