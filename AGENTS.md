# AGENTS.md — 课程表小程序

## Project

WeChat Mini Program — a course timetable (课程表) app, native framework, no npm/packages.

## Key files

| Path | Role |
|---|---|
| `app.js` / `app.json` / `app.wxss` | App entry |
| `utils/util.js` | All business logic (CRUD, holidays, import parsing, backup) |
| `pages/index/index.*` | Main schedule grid (week/day view) |
| `pages/addCourse/addCourse.*` | Add/edit course form |
| `pages/settings/settings.*` | Semester settings, holidays, backup/restore |
| `pages/import/import.*` | File import (JSON/CSV, not xlsx) with preview |
| `components/navigation-bar/` | Custom nav bar (required by `navigationStyle: "custom"`) |

## App quirks

- **Render engine**: `"renderer": "skyline"` + `"componentFramework": "glass-easel"` in `app.json`. Avoid WebView-only APIs.
- **Custom nav**: `navigationStyle: "custom"` — every page must use `<navigation-bar>`. The component reads `wx.getMenuButtonBoundingClientRect()` for layout.
- **Storage**: All data per-semester via keys `settings_{id}` and `courses_{id}`. `wx.setStorageSync` / `getStorageSync` only.
- **Semester isolation**: `currentSemesterId` in storage; `util.switchSemester()`, `util.createSemester()` manage data separation.
- **No npm / bundler**: Pure native WXS/WXSS/WXML/JS. No build step, no package.json.

## Data structures

**Course**: `{ id, name, teacher, location, day (1-7), startLesson, lessonCount, weeks (number[]), color, createdAt, updatedAt }`

**Settings**: `{ semesterName, startDate (YYYY-MM-DD), totalWeeks, showWeekend, lessonsPerDay: { morning, afternoon, evening }, lessonTimes, holidayConfig }`

**Holiday config**: `{ holidays: string[], workdays: string[], workdayMakeupMap: { [date]: 1-7 } }`

**Backup file**: `{ version: 1, exportTime, currentSemesterId, semesters, data: { [id]: { settings, courses } } }`

## Key functions in `utils/util.js`

| Function | What |
|---|---|
| `getCurrentWeek(startDate, totalWeeks)` | Derives week from `startDate` vs today |
| `getWeekDates(startDate, week, showDays)` | Returns `YYYY-MM-DD` strings for the week |
| `checkCourseConflict(courseData, excludeId)` | Checks day+lesson+week overlap |
| `parseWeeksString(str)` | Parses "1-18(单)", "1,3,5", "1-18 双周" |
| `parseCoursesCSV/JSON` | Import parsing |
| `buildBackupData/restoreFromBackup` | Full data backup/restore |

## Built-in holidays

Chinese public holidays for 2024, 2025, 2026 hardcoded in `util.js:BUILTIN_HOLIDAYS`. Year-specific; update annually.

## Import limitations

- **No xlsx parsing**: Binary format unsupported in mini program. User must convert to CSV/JSON.
- **OCR not implemented**: Image import for OCR is described in TODO but not wired.

## ESLint

`.eslintrc.js` defines WeChat globals (`wx`, `App`, `Page`, `Component`, etc.) but `extends` is commented out — only `rules: {}`.
