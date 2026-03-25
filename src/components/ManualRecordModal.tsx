"use client";

import { useState } from "react";
import { CalendarEvent, CATEGORIES, CategoryId } from "@/lib/calendar-types";
import CategoryPicker from "./CategoryPicker";

interface ManualRecordModalProps {
  event: CalendarEvent | null; // null이면 새 활동
  onClose: () => void;
  onSaved: () => void;
}

function toLocalDateTimeInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowLocalInput(): string {
  return toLocalDateTimeInput(new Date().toISOString());
}

export default function ManualRecordModal({ event, onClose, onSaved }: ManualRecordModalProps) {
  const defaultStart = event?.start ? toLocalDateTimeInput(event.start) : nowLocalInput();
  const defaultEnd   = event?.end   ? toLocalDateTimeInput(event.end)   : nowLocalInput();

  const [title, setTitle]       = useState(event?.summary ?? "");
  const [startVal, setStart]    = useState(defaultStart);
  const [endVal, setEnd]        = useState(defaultEnd);
  const [category, setCategory] = useState<CategoryId | null>(event?.category ?? null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const handleSave = async () => {
    if (!title.trim()) { setError("제목을 입력하세요"); return; }
    if (!category)     { setError("카테고리를 선택하세요"); return; }
    if (!startVal || !endVal) { setError("시간을 입력하세요"); return; }
    const startISO = new Date(startVal).toISOString();
    const endISO   = new Date(endVal).toISOString();
    if (new Date(endISO) <= new Date(startISO)) { setError("종료 시간이 시작보다 늦어야 해요"); return; }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/events/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          startTime: startISO,
          endTime: endISO,
          category,
          originalEventId: event?.id,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      onSaved();
      onClose();
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* 딤 배경 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 바텀시트 */}
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white px-5 pb-8 pt-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

        <h2 className="mb-4 text-base font-semibold text-gray-900">
          {event ? "활동 기록 추가" : "새 활동 기록"}
        </h2>

        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="mb-1 block text-xs text-gray-500">활동 이름</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="무엇을 했나요?"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          {/* 시간 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">시작</label>
              <input
                type="datetime-local"
                value={startVal}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">종료</label>
              <input
                type="datetime-local"
                value={endVal}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>

          {/* 카테고리 */}
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-400">카테고리</label>
            <CategoryPicker selected={category} onSelect={setCategory} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* 저장 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
              saving ? "cursor-wait bg-blue-100 text-blue-400" : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {saving ? "저장 중..." : "기록 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
