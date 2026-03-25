"use client";

import { CATEGORIES, CategoryId } from "@/lib/calendar-types";

interface CategoryPickerProps {
  selected: CategoryId | null;
  onSelect: (id: CategoryId) => void;
}

export default function CategoryPicker({ selected, onSelect }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-start rounded-xl px-4 py-3 text-left transition-all active:scale-[0.97] ${
            selected === cat.id
              ? "bg-gray-900 text-white ring-2 ring-gray-900"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="text-lg">{cat.emoji}</span>
          <span className="mt-1 text-sm font-medium">{cat.label}</span>
          <span
            className={`text-[11px] ${selected === cat.id ? "text-gray-400" : "text-gray-400"}`}
          >
            {cat.examples}
          </span>
        </button>
      ))}
    </div>
  );
}
