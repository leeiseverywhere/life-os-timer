"use client";

import { useState } from "react";
import { CalendarEvent, CATEGORIES, CategoryId } from "@/lib/calendar-types";

interface CategoryChangeModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onSaved: (newCategory: CategoryId | null) => void;
}

export default function CategoryChangeModal({ event, onClose, onSaved }: CategoryChangeModalProps) {
  const [selected, setSelected] = useState<CategoryId | null>(event.category ?? null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/events/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, category: selected }),
      });
      onSaved(selected);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white px-5 pb-8 pt-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />
        <h2 className="mb-1 text-base font-semibold text-gray-900">카테고리 설정</h2>
        <p className="mb-4 truncate text-xs text-gray-400">{event.summary}</p>

        {/* 카테고리 그리드 */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {CATEGORIES.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelected(isSelected ? null : cat.id)}
                className={`flex flex-col items-start rounded-xl px-4 py-3 text-left transition-all active:scale-[0.97] ${
                  isSelected
                    ? "bg-gray-900 text-white ring-2 ring-gray-900"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{cat.emoji}</span>
                <span className="mt-1 text-sm font-medium">{cat.label}</span>
                <span className="text-[11px] text-gray-400">{cat.examples}</span>
              </button>
            );
          })}
        </div>

        {selected === null && event.category && (
          <p className="mb-3 text-center text-xs text-gray-400">선택 해제 시 미분류로 저장됩니다</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-all ${
            saving ? "cursor-wait bg-gray-100 text-gray-400" : "bg-gray-900 text-white hover:bg-gray-800"
          }`}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
