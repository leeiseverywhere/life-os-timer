# Handoff Spec: Life OS Timer

## Overview
Google Calendar 기반 계획-실행 비교 타이머 앱. 사용자가 캘린더의 계획 이벤트를 선택하거나 새 활동을 입력하고, 타이머로 실제 실행 시간을 기록. 완료 시 Google Calendar에 파란색 이벤트 자동 생성.

**Primary persona**: 모바일에서 한 손으로 타이머를 조작하는 사용자
**Design reference**: Linear, Notion, Things 3 수준의 미니멀 퀄리티

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `color-surface` | `#ffffff` | App background |
| `color-text-primary` | `#111827` (gray-900) | Headings, primary text |
| `color-text-secondary` | `#9ca3af` (gray-400) | Subtext, timestamps |
| `color-text-tertiary` | `#d1d5db` (gray-300) | Counters, dividers |
| `color-surface-secondary` | `#f9fafb` (gray-50) | Event cards, inputs bg |
| `color-border` | `#f3f4f6` (gray-100) | Header/tab borders |
| `color-interactive` | `#111827` (gray-900) | Primary buttons, active tab |
| `color-interactive-hover` | `#1f2937` (gray-800) | Primary button hover |
| `color-complete` | `#3b82f6` (blue-500) | Completion button, done indicators |
| `color-plan-dot` | `#9ca3af` (gray-400) | Plan event indicator |
| `color-external-dot` | `#ef4444` (red-500) | External event indicator |
| `color-done-dot` | `#3b82f6` (blue-500) | Completed event indicator |
| `color-sleep-dot` | `#a855f7` (purple-500) | Sleep event indicator |
| `radius-card` | `12px` (rounded-xl) | Cards, buttons, inputs |
| `radius-icon` | `16px` (rounded-2xl) | App icon container |
| `radius-avatar` | `50%` (rounded-full) | User avatar |
| `spacing-page` | `20px` (px-5) | Page horizontal padding |
| `spacing-section` | `24px` (space-y-6) | Between sections |
| `spacing-card-inner` | `16px 12px` (px-4 py-3) | Inside event cards |
| `font-timer` | Geist Mono, 60px/72px, 300 weight | Timer display |
| `font-heading` | Geist Sans, 16px, 600 weight | App title |
| `font-body` | Geist Sans, 14px, 500 weight | Event titles |
| `font-caption` | Geist Sans, 12px, 400 weight | Timestamps, labels |
| `font-micro` | Geist Sans, 11px, 400 weight | Category examples |

---

## Layout

- **Max width**: `512px` (max-w-lg), centered on desktop
- **Mobile**: Full-width, no side margins beyond `spacing-page`
- **Header**: Sticky top, frosted glass (`backdrop-blur-xl`, 80% white)
- **Bottom bar**: Sticky bottom, frosted glass
- **Content**: Flex column, fills available height

### Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| Mobile (<640px) | Full-width layout, timer text 60px, touch targets 48px min height |
| Desktop (≥640px) | Max-width 512px centered, timer text 72px (sm:text-7xl) |

---

## Screens & Components

### 1. Login Screen
| Element | Spec |
|---------|------|
| Icon container | 64×64px, rounded-2xl, gray-900 bg, centered clock SVG |
| Title | "Life OS Timer", 24px semibold, tight tracking |
| Subtitle | "계획하고, 실행하고, 비교하세요", 14px, gray-500 |
| Google button | Full-width, gray-900, rounded-xl, 14px medium, Google logo left |
| Footer text | 12px, gray-400 |

### 2. Dashboard Header
| Element | Spec |
|---------|------|
| Title | "Life OS", 16px semibold |
| Date | Korean locale format "3월 25일 (화)", 12px, gray-400 |
| Avatar | 28×28px, rounded-full |
| Logout | 12px text button, gray-400 → gray-600 on hover |

### 3. Tab Navigation
| State | Spec |
|-------|------|
| Active | 2px bottom border (gray-900), gray-900 text |
| Inactive | No border, gray-400 text, gray-600 on hover |
| Transition | `transition-colors` (150ms default) |

### 4. Event List
| Element | Spec |
|---------|------|
| Section header | 12px, uppercase, letter-spacing wider, gray-400, count in gray-300 |
| Event card | Full-width button, rounded-xl, px-4 py-3 |
| Color dot | 8×8px circle, color matches GCal color system |
| Event title | 14px medium, truncate on overflow |
| Time range | 12px, gray-400, "HH:MM – HH:MM" |
| Chevron | 16×16px, gray-300 → gray-500 on hover (plan events only) |

**Event card states:**

| State | Spec |
|-------|------|
| Default (plan) | gray-100 bg |
| Hover (plan) | + ring-2 ring-gray-200 |
| Active/selected | gray-900 bg, white text, ring-2 ring-gray-900 |
| Non-selectable | 75% opacity, cursor-default |
| Press | scale(0.98) |

### 5. Timer — Idle (no selection)
| Element | Spec |
|---------|------|
| Prompt | "일정을 선택하거나 직접 입력하세요", 14px, gray-400, centered |
| Input | Full-width, rounded-xl, gray-200 border, gray-100 focus ring |

### 6. Timer — Category Selection
| Element | Spec |
|---------|------|
| Selected event | gray-50 card with title + planned time, X close button |
| Category grid | 2×2 grid, gap-2 |
| Category card | rounded-xl, px-4 py-3, emoji + label + examples |
| Category selected | gray-900 bg, white text, ring-2 |
| Start button | Full-width, rounded-xl, py-4, 16px semibold |
| Start disabled | gray-100 bg, gray-300 text, not-allowed cursor |

### 7. Timer — Running/Paused
| Element | Spec |
|---------|------|
| Activity name | 14px, gray-400, centered |
| Timer digits | Geist Mono, 60px (72px on sm+), 300 weight, tabular-nums |
| Start time | 12px, gray-400, "HH:MM 시작" |
| Pause button | flex-1, gray-100 bg, gray-700 text |
| Resume button | flex-1, gray-900 bg, white text |
| Complete button | flex-1, blue-500 bg, white text |
| Complete loading | blue-100 bg, blue-400 text, "저장 중..." |
| Reset link | 12px, gray-400, centered, underline on hover |

---

## States & Interactions

| Element | Trigger | Behavior |
|---------|---------|----------|
| All buttons | Press | scale(0.98) for 150ms |
| All buttons | Hover | Darken bg by one shade |
| Timer | Running | Updates every 200ms, uses `Date.now()` diff for accuracy |
| Timer | Pause | Preserves elapsed, stops interval |
| Timer | Complete | POST → blue event in GCal, reset to events view, refresh list |
| Timer | Complete fail | Reverts to paused state, console error |
| Event select | Tap plan event | Switch to timer tab with event pre-filled |
| Bottom bar | "+ 새 활동" | Switch to timer tab (idle state) |

---

## Edge Cases

- **Empty state**: Calendar emoji + "오늘 일정이 없습니다" centered
- **Long event title**: `truncate` (text-overflow: ellipsis)
- **Loading**: Single spinner (24×24px, gray-200 border, gray-900 top border, spinning)
- **Auth expired**: API returns 401 → should redirect to login
- **Slow network on complete**: "저장 중..." state with disabled button
- **All-day events**: Shows date string without time formatting

---

## Animation / Motion

| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Buttons | Press | scale(0.97-0.98) | 150ms | ease-out |
| Header/bottom | Scroll | Frosted glass blur stays fixed | - | - |
| Spinner | Loading | rotate 360° | 750ms | linear, infinite |
| Tab indicator | Switch | border-bottom appears | 150ms | ease |
| Event card ring | Hover | ring appears | 150ms | ease |

---

## Accessibility Notes

- **Focus order**: Header → Tabs → Event list (top to bottom) → Bottom bar
- **ARIA**: Event cards use `<button>` with disabled state for non-selectable events
- **Keyboard**: All interactive elements are buttons, accessible via Tab + Enter
- **Touch targets**: Minimum 44px height on all buttons (py-3 = 48px effective)
- **Color**: Not relying solely on color — dot indicators paired with section headers
- **Viewport**: `user-scalable=false` for app-like feel, `maximum-scale=1`
- **Safe areas**: Body respects `env(safe-area-inset-*)` for notched devices

---

## PWA Support

- Web App Manifest at `/manifest.json`
- `display: standalone` for native app feel
- Apple web app meta tags for iOS home screen
- Theme color: `#ffffff`
