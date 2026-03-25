"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarEvent, CATEGORIES, CategoryId } from "@/lib/calendar-types";
import CategoryChangeModal from "./CategoryChangeModal";
import ManualRecordModal from "./ManualRecordModal";

interface EventListProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent | null) => void;
  activeEventId?: string;
  onRefresh: () => void;
}

function fmtTime(iso: string) {
  if (!iso || iso.length === 10) return ""; // all-day
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// 현재 시간과의 거리로 opacity 계산 (진행 중 = 1.0, 멀수록 낮아짐)
function getOpacity(event: CalendarEvent): number {
  if (event.isAllDay) return 1;
  const now = Date.now();
  const start = new Date(event.start).getTime();
  const end   = new Date(event.end).getTime();
  if (start <= now && now <= end) return 1;          // 진행 중
  const closest = start > now ? start : end;
  const hours = Math.abs(closest - now) / 3_600_000;
  if (hours <= 1)  return 0.95;
  if (hours <= 2)  return 0.85;
  if (hours <= 4)  return 0.75;
  if (hours <= 8)  return 0.65;
  return 0.50;
}

// 카테고리 정보
function getCatInfo(id?: CategoryId) {
  return CATEGORIES.find((c) => c.id === id);
}

// all-day end가 다음날 자정이면 오늘 끝으로 간주 (Google Calendar 관행)
function isSelectableType(event: CalendarEvent) {
  return !event.isAllDay && (!event.colorId || event.colorId === "8");
}

export default function EventList({ events, onSelectEvent, activeEventId, onRefresh }: EventListProps) {
  const nowRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const [categoryTarget, setCategoryTarget] = useState<CalendarEvent | null>(null);
  const [recordTarget, setRecordTarget]     = useState<CalendarEvent | null>(null);
  const [showNewRecord, setShowNewRecord]   = useState(false);

  // 1분마다 시간 선 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    nowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 text-4xl">📅</div>
        <p className="text-sm text-gray-400">오늘 일정이 없습니다</p>
      </div>
    );
  }

  const now = new Date();

  // ── all-day / timed 분리 ──────────────────────────────────────
  const allDayEvents = events.filter((e) => e.isAllDay);
  const timedEvents  = events
    .filter((e) => !e.isAllDay)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // 현재 시간선 삽입 인덱스
  const nowLineIdx = timedEvents.findIndex((e) => new Date(e.start) > now);
  // nowLineIdx === -1 → 현재 시간이 모든 이벤트 이후 → 맨 끝에 추가

  const handleToggle = (event: CalendarEvent) => {
    if (!isSelectableType(event)) return;
    onSelectEvent(event.id === activeEventId ? null : event);
  };

  // ── 이벤트 카드 ────────────────────────────────────────────────
  const renderCard = (event: CalendarEvent) => {
    const isActive   = event.id === activeEventId;
    const isOngoing  = new Date(event.start) <= now && new Date(event.end) >= now;
    const isDone     = event.colorId === "9";
    const isExternal = event.colorId === "11";
    const isSleep    = event.colorId === "3";
    const isSelectable = isSelectableType(event);
    const opacity    = getOpacity(event);
    const catInfo    = getCatInfo(event.category);

    // 진행 중인 이벤트에 시간선 오버레이 계산
    let nowLinePct: number | null = null;
    if (isOngoing) {
      const total = new Date(event.end).getTime() - new Date(event.start).getTime();
      const passed = now.getTime() - new Date(event.start).getTime();
      nowLinePct = Math.min(Math.max((passed / total) * 100, 2), 98);
    }

    // 색상
    let bg = "bg-gray-50", textCls = "text-gray-900", dotCls = "bg-gray-300";
    if (isDone)     { bg = "bg-blue-50";   textCls = "text-blue-800";  dotCls = "bg-blue-400"; }
    if (isExternal) { bg = "bg-red-50";    textCls = "text-red-800";   dotCls = "bg-red-400";  }
    if (isSleep)    { bg = "bg-purple-50"; textCls = "text-purple-800";dotCls = "bg-purple-400";}

    return (
      <div
        key={event.id}
        style={{ opacity }}
        className="relative"
      >
        {/* 현재 시간선 오버레이 (진행 중인 이벤트 위에) */}
        {nowLinePct !== null && (
          <div
            ref={nowRef}
            className="pointer-events-none absolute left-0 right-0 z-10 flex items-center gap-2 px-2"
            style={{ top: `${nowLinePct}%` }}
          >
            <div className="h-3 w-3 shrink-0 rounded-full bg-red-500 shadow shadow-red-300 ring-2 ring-white" />
            <div className="flex-1 border-t-2 border-red-400" />
            <span className="shrink-0 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
              {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
          </div>
        )}

        <div
          className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 transition-all ${bg} ${
            isActive  ? "ring-2 ring-gray-900" :
            isOngoing ? "ring-2 ring-green-300" : ""
          }`}
        >
          {/* 왼쪽 dot */}
          <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-gray-900" : dotCls}`} />

          {/* 메인 콘텐츠 */}
          <div className="min-w-0 flex-1">
            {/* 제목 + 시간 */}
            <button
              onClick={() => handleToggle(event)}
              disabled={!isSelectable}
              className={`block w-full text-left ${isSelectable ? "cursor-pointer" : "cursor-default"}`}
            >
              <p className={`truncate text-sm font-medium ${isActive ? "text-gray-900 font-semibold" : textCls}`}>
                {event.summary}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {fmtTime(event.start)} – {fmtTime(event.end)}
                {isOngoing && <span className="ml-1.5 font-medium text-green-500">진행 중</span>}
              </p>
            </button>

            {/* 하단 배지 행 */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {/* 카테고리 태그 (토스 스타일) */}
              <button
                onClick={() => setCategoryTarget(event)}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  catInfo
                    ? "bg-gray-900/5 text-gray-700 hover:bg-gray-900/10"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                {catInfo ? (
                  <><span>{catInfo.emoji}</span><span>{catInfo.label}</span></>
                ) : (
                  <><span>•••</span><span>미분류</span></>
                )}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* tracked / not tracked 상태 */}
              {isDone ? (
                <span className="flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Tracked
                  {event.isTimerDone && <span className="ml-0.5 opacity-70">⏱</span>}
                </span>
              ) : isSelectable ? (
                <span className="flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
                  Not tracked
                </span>
              ) : null}
            </div>

            {/* 기록 추가 버튼 (not-done + selectable) */}
            {isSelectable && !isDone && (
              <button
                onClick={() => setRecordTarget(event)}
                className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                사후 기록
              </button>
            )}
          </div>

          {/* 오른쪽: 선택 화살표 */}
          {isSelectable && (
            <div className="mt-1 shrink-0">
              {isActive ? (
                <svg className="h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── 현재 시간선 (이벤트 사이에 삽입용, 진행 중 이벤트 없을 때) ──
  const nowLineStandalone = (
    <div ref={nowRef} className="flex items-center gap-2 py-1">
      <div className="h-3 w-3 shrink-0 rounded-full bg-red-500 ring-2 ring-white shadow shadow-red-200" />
      <div className="flex-1 border-t-2 border-red-400" />
      <span className="shrink-0 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
      </span>
    </div>
  );

  // 현재 진행 중인 이벤트가 있는지 확인
  const hasOngoing = timedEvents.some((e) => new Date(e.start) <= now && new Date(e.end) >= now);

  return (
    <>
      <div className="space-y-4 pb-4">
        {/* ── All-day 섹션 (Pinned) ── */}
        {allDayEvents.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              📌 하루 종일
            </p>
            <div className="space-y-1.5">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">{event.summary}</p>
                    <p className="text-[11px] text-gray-400">하루 종일</p>
                  </div>
                  <button
                    onClick={() => setCategoryTarget(event)}
                    className={`ml-3 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
                      getCatInfo(event.category)
                        ? "bg-gray-900/5 text-gray-600 hover:bg-gray-900/10"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                    }`}
                  >
                    {getCatInfo(event.category) ? (
                      <><span>{getCatInfo(event.category)!.emoji}</span><span>{getCatInfo(event.category)!.label}</span></>
                    ) : (
                      <span>미분류</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 시간별 일정 ── */}
        {timedEvents.length > 0 && (
          <div className="space-y-1.5">
            {timedEvents.map((event, idx) => (
              <div key={event.id}>
                {/* 현재 시간선 삽입 (진행 중 이벤트 없을 때만) */}
                {!hasOngoing && idx === (nowLineIdx === -1 ? timedEvents.length : nowLineIdx) && nowLineStandalone}
                {renderCard(event)}
              </div>
            ))}
            {/* 현재 시간이 맨 끝에 있을 때 */}
            {!hasOngoing && nowLineIdx === -1 && nowLineStandalone}
          </div>
        )}

        {/* ── 새 활동 추가 버튼 ── */}
        <button
          onClick={() => setShowNewRecord(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          활동 직접 추가
        </button>
      </div>

      {/* 카테고리 변경 모달 */}
      {categoryTarget && (
        <CategoryChangeModal
          event={categoryTarget}
          onClose={() => setCategoryTarget(null)}
          onSaved={(newCat) => {
            setCategoryTarget(null);
            onRefresh();
            void newCat;
          }}
        />
      )}

      {/* 사후 기록 모달 */}
      {(recordTarget || showNewRecord) && (
        <ManualRecordModal
          event={recordTarget}
          onClose={() => { setRecordTarget(null); setShowNewRecord(false); }}
          onSaved={() => { setRecordTarget(null); setShowNewRecord(false); onRefresh(); }}
        />
      )}
    </>
  );
}
