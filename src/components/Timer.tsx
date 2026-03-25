"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CalendarEvent, CategoryId } from "@/lib/calendar-types";
import CategoryPicker from "./CategoryPicker";

type TimerState = "idle" | "category" | "running" | "paused" | "completing";

interface TimerProps {
  selectedEvent: CalendarEvent | null;
  onComplete: () => void;
  onClear: () => void;
}

export default function Timer({ selectedEvent, onComplete, onClear }: TimerProps) {
  const [state, setState] = useState<TimerState>("idle");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [customTitle, setCustomTitle] = useState("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedElapsedRef = useRef(0);
  const resumeTimeRef = useRef<Date | null>(null);

  const title = selectedEvent?.summary || customTitle;

  // Timer tick
  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => {
        if (resumeTimeRef.current) {
          const now = Date.now();
          const diff = Math.floor((now - resumeTimeRef.current.getTime()) / 1000);
          setElapsed(pausedElapsedRef.current + diff);
        }
      }, 200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  const formatElapsed = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSelectCategory = (id: CategoryId) => {
    setCategory(id);
  };

  const handleStart = useCallback(() => {
    if (!category) return;
    const now = new Date();
    setStartTime(now);
    resumeTimeRef.current = now;
    pausedElapsedRef.current = 0;
    setElapsed(0);
    setState("running");
  }, [category]);

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

      if (!res.ok) throw new Error("Failed to create event");

      // Reset
      setState("idle");
      setCategory(null);
      setElapsed(0);
      setStartTime(null);
      setCustomTitle("");
      pausedElapsedRef.current = 0;
      resumeTimeRef.current = null;
      onComplete();
    } catch (error) {
      console.error(error);
      setState("paused");
    }
  };

  const handleReset = () => {
    setState("idle");
    setCategory(null);
    setElapsed(0);
    setStartTime(null);
    setCustomTitle("");
    pausedElapsedRef.current = 0;
    resumeTimeRef.current = null;
    onClear();
  };

  // Phase 1: Select event or enter custom title
  if (state === "idle" && !selectedEvent && !customTitle) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-400">일정을 선택하거나 직접 입력하세요</p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="새 활동 입력..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />
        </div>
      </div>
    );
  }

  // Phase 2: Category selection
  if (state === "idle" || state === "category") {
    return (
      <div className="space-y-5">
        {/* Selected activity */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">{title}</p>
            {selectedEvent && (
              <p className="text-xs text-gray-400">
                계획: {new Date(selectedEvent.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                {" – "}
                {new Date(selectedEvent.end).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Category picker */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">카테고리</p>
          <CategoryPicker selected={category} onSelect={handleSelectCategory} />
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={!category}
          className={`w-full rounded-xl py-4 text-base font-semibold transition-all active:scale-[0.98] ${
            category
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "cursor-not-allowed bg-gray-100 text-gray-300"
          }`}
        >
          타이머 시작
        </button>
      </div>
    );
  }

  // Phase 3: Timer running / paused
  return (
    <div className="space-y-6">
      {/* Activity info */}
      <div className="text-center">
        <p className="text-sm text-gray-400">{title}</p>
      </div>

      {/* Timer display */}
      <div className="text-center">
        <p className="font-mono text-6xl font-light tabular-nums tracking-tight text-gray-900 sm:text-7xl">
          {formatElapsed(elapsed)}
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {startTime?.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })} 시작
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {state === "running" ? (
          <button
            onClick={handlePause}
            className="flex-1 rounded-xl bg-gray-100 py-4 text-base font-semibold text-gray-700 transition-all hover:bg-gray-200 active:scale-[0.98]"
          >
            일시정지
          </button>
        ) : state === "paused" ? (
          <button
            onClick={handleResume}
            className="flex-1 rounded-xl bg-gray-900 py-4 text-base font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.98]"
          >
            재개
          </button>
        ) : null}

        <button
          onClick={handleComplete}
          disabled={state === "completing"}
          className={`flex-1 rounded-xl py-4 text-base font-semibold transition-all active:scale-[0.98] ${
            state === "completing"
              ? "cursor-wait bg-blue-100 text-blue-400"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {state === "completing" ? "저장 중..." : "완료 ✓"}
        </button>
      </div>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="w-full text-center text-xs text-gray-400 transition-colors hover:text-gray-600"
      >
        초기화
      </button>
    </div>
  );
}
