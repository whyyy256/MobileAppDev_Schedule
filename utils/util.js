// utils/util.js

// 默认设置
const DEFAULT_SETTINGS = {
  semesterName: '2024-2025学年第一学期',
  startDate: '2024-09-01', // 学期开始日期
  totalWeeks: 18, // 总教学周数
  showWeekend: true, // 是否显示周末
  lessonsPerDay: {
    morning: 4, // 上午节数
    afternoon: 4, // 下午节数
    evening: 3 // 晚上节数
  },
  lessonDuration: {
    classMinutes: 45, // 每节课时长
    breakMinutes: 10 // 课间休息
  },
  // 默认每节课上下课时间
  lessonTimes: [
    { lesson: 1, start: '08:00', end: '08:45', section: 'morning' },
    { lesson: 2, start: '08:55', end: '09:40', section: 'morning' },
    { lesson: 3, start: '10:00', end: '10:45', section: 'morning' },
    { lesson: 4, start: '10:55', end: '11:40', section: 'morning' },
    { lesson: 5, start: '14:00', end: '14:45', section: 'afternoon' },
    { lesson: 6, start: '14:55', end: '15:40', section: 'afternoon' },
    { lesson: 7, start: '16:00', end: '16:45', section: 'afternoon' },
    { lesson: 8, start: '16:55', end: '17:40', section: 'afternoon' },
    { lesson: 9, start: '19:00', end: '19:45', section: 'evening' },
    { lesson: 10, start: '19:55', end: '20:40', section: 'evening' },
    { lesson: 11, start: '20:50', end: '21:35', section: 'evening' }
  ]
}

// 默认课程颜色列表
const COURSE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80'
]

// 内置法定节假日数据（放假日期 + 调休上班日期），按年份维护
// 数据来源：国务院办公厅发布的《关于部分节假日安排的通知》
const BUILTIN_HOLIDAYS = {
  // 2024 年安排（国办发明电〔2023〕7 号）
  2024: {
    holidays: [
      '2024-01-01',
      '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13', '2024-02-14', '2024-02-15', '2024-02-16', '2024-02-17',
      '2024-04-04', '2024-04-05', '2024-04-06',
      '2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04', '2024-05-05',
      '2024-06-08', '2024-06-09', '2024-06-10',
      '2024-09-15', '2024-09-16', '2024-09-17',
      '2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04', '2024-10-05', '2024-10-06', '2024-10-07'
    ],
    workdays: [
      '2024-02-04', '2024-02-18',
      '2024-04-07',
      '2024-04-28', '2024-05-11',
      '2024-09-14',
      '2024-09-29', '2024-10-12'
    ]
  },
  // 2025 年安排（国办发明电〔2024〕12 号，2025 年起春节、劳动节各增 1 天）
  2025: {
    holidays: [
      '2025-01-01',
      '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04',
      '2025-04-04', '2025-04-05', '2025-04-06',
      '2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05',
      '2025-05-31', '2025-06-01', '2025-06-02',
      '2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08'
    ],
    workdays: [
      '2025-01-26', '2025-02-08',
      '2025-04-27',
      '2025-09-28', '2025-10-11'
    ]
  },
  // 2026 年安排（国办发明电〔2025〕7 号）
  2026: {
    holidays: [
      '2026-01-01', '2026-01-02', '2026-01-03',
      '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
      '2026-04-04', '2026-04-05', '2026-04-06',
      '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
      '2026-06-19', '2026-06-20', '2026-06-21',
      '2026-09-25', '2026-09-26', '2026-09-27',
      '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'
    ],
    workdays: [
      '2026-01-04',
      '2026-02-14', '2026-02-28',
      '2026-05-09',
      '2026-09-20', '2026-10-10'
    ]
  }
}

// ====== 学期管理 ======
function getCurrentSemesterId() {
  try {
    return wx.getStorageSync('currentSemesterId') || 'default'
  } catch (e) {
    return 'default'
  }
}

function setCurrentSemesterId(id) {
  try {
    wx.setStorageSync('currentSemesterId', id)
    return true
  } catch (e) {
    console.error('切换学期失败', e)
    return false
  }
}

function getSemesters() {
  try {
    return wx.getStorageSync('semesters') || []
  } catch (e) {
    console.error('读取学期列表失败', e)
    return []
  }
}

function saveSemesters(semesters) {
  try {
    wx.setStorageSync('semesters', semesters)
    return true
  } catch (e) {
    console.error('保存学期列表失败', e)
    return false
  }
}

function ensureDefaultSemester() {
  const semesters = getSemesters()
  if (semesters.length === 0) {
    const defaultSemester = {
      id: 'default',
      name: DEFAULT_SETTINGS.semesterName,
      startDate: DEFAULT_SETTINGS.startDate,
      totalWeeks: DEFAULT_SETTINGS.totalWeeks,
      createdAt: Date.now()
    }
    saveSemesters([defaultSemester])
    saveSettings(DEFAULT_SETTINGS, 'default')
    setCurrentSemesterId('default')
  }
}

function createSemester(name, startDate, totalWeeks) {
  ensureDefaultSemester()

  const id = 'sem_' + Date.now()
  const semesters = getSemesters()
  const newSemester = {
    id,
    name: name || `新学期 ${semesters.length + 1}`,
    startDate: startDate || DEFAULT_SETTINGS.startDate,
    totalWeeks: totalWeeks || DEFAULT_SETTINGS.totalWeeks,
    createdAt: Date.now()
  }

  // 保存当前学期到历史后再切换
  const currentId = getCurrentSemesterId()
  const currentIndex = semesters.findIndex(s => s.id === currentId)
  if (currentIndex > -1) {
    const currentSettings = getSettingsRaw(currentId)
    semesters[currentIndex] = {
      ...semesters[currentIndex],
      name: currentSettings.semesterName,
      startDate: currentSettings.startDate,
      totalWeeks: currentSettings.totalWeeks
    }
  }

  semesters.push(newSemester)
  saveSemesters(semesters)

  // 为新学期生成默认设置
  const newSettings = {
    ...DEFAULT_SETTINGS,
    semesterName: newSemester.name,
    startDate: newSemester.startDate,
    totalWeeks: newSemester.totalWeeks
  }
  saveSettings(newSettings, id)
  setCurrentSemesterId(id)

  return newSemester
}

function switchSemester(id) {
  const semesters = getSemesters()
  if (!semesters.find(s => s.id === id)) return false

  // 同步当前学期 meta 到列表
  const currentId = getCurrentSemesterId()
  const currentIndex = semesters.findIndex(s => s.id === currentId)
  if (currentIndex > -1) {
    const currentSettings = getSettingsRaw(currentId)
    semesters[currentIndex] = {
      ...semesters[currentIndex],
      name: currentSettings.semesterName,
      startDate: currentSettings.startDate,
      totalWeeks: currentSettings.totalWeeks
    }
    saveSemesters(semesters)
  }

  setCurrentSemesterId(id)
  return true
}

function updateSemesterMeta(id, meta) {
  const semesters = getSemesters()
  const index = semesters.findIndex(s => s.id === id)
  if (index === -1) return false
  semesters[index] = { ...semesters[index], ...meta }
  saveSemesters(semesters)
  return true
}

function deleteSemester(id) {
  let semesters = getSemesters()
  if (semesters.length <= 1) return false
  semesters = semesters.filter(s => s.id !== id)
  saveSemesters(semesters)

  try {
    wx.removeStorageSync(`settings_${id}`)
    wx.removeStorageSync(`courses_${id}`)
  } catch (e) {}

  if (getCurrentSemesterId() === id) {
    setCurrentSemesterId(semesters[0].id)
  }
  return true
}

// ====== 设置 ======
function getSettingsRaw(semesterId) {
  const id = semesterId || getCurrentSemesterId()
  try {
    const s = wx.getStorageSync(`settings_${id}`)
    return s || DEFAULT_SETTINGS
  } catch (e) {
    return DEFAULT_SETTINGS
  }
}

function getSettings(semesterId) {
  ensureDefaultSemester()
  return getSettingsRaw(semesterId)
}

function saveSettings(settings, semesterId) {
  const id = semesterId || getCurrentSemesterId()
  try {
    wx.setStorageSync(`settings_${id}`, settings)

    // 同步更新学期列表中的 meta
    updateSemesterMeta(id, {
      name: settings.semesterName,
      startDate: settings.startDate,
      totalWeeks: settings.totalWeeks
    })
    return true
  } catch (e) {
    console.error('保存设置失败', e)
    return false
  }
}

// 保存课程列表
function saveCourses(courses, semesterId) {
  const id = semesterId || getCurrentSemesterId()
  try {
    wx.setStorageSync(`courses_${id}`, courses)
    return true
  } catch (e) {
    console.error('保存课程失败', e)
    return false
  }
}

// 获取课程列表
function getCourses(semesterId) {
  const id = semesterId || getCurrentSemesterId()
  try {
    return wx.getStorageSync(`courses_${id}`) || []
  } catch (e) {
    console.error('读取课程失败', e)
    return []
  }
}

// 根据一节课时间推算下一节课时间
function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(':').map(Number)
  const date = new Date(2000, 0, 1, h, m + minutes)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function generateLessonTime(lesson, prev, settings) {
  const s = settings || getSettings()
  const classMinutes = s.lessonDuration.classMinutes || 45
  const breakMinutes = s.lessonDuration.breakMinutes || 10
  const section = lesson <= (s.lessonsPerDay.morning || 0) ? 'morning'
    : lesson <= (s.lessonsPerDay.morning || 0) + (s.lessonsPerDay.afternoon || 0) ? 'afternoon'
      : 'evening'

  if (!prev) {
    const defaultTime = DEFAULT_SETTINGS.lessonTimes.find(t => t.lesson === lesson)
    return defaultTime || { lesson, start: '08:00', end: addMinutes('08:00', classMinutes), section }
  }

  const start = addMinutes(prev.end, breakMinutes)
  return {
    lesson,
    start,
    end: addMinutes(start, classMinutes),
    section
  }
}

// 获取完整的课程时间表（合并用户自定义与默认，不足时自动推算）
function getLessonTimes(settings) {
  const s = settings || getSettings()
  const totalLessons = (s.lessonsPerDay.morning || 0) + (s.lessonsPerDay.afternoon || 0) + (s.lessonsPerDay.evening || 0)
  const customs = s.lessonTimes || []

  const result = []
  for (let i = 1; i <= totalLessons; i++) {
    const custom = customs.find(c => c.lesson === i)
    const def = generateLessonTime(i, result[i - 2], s)
    result.push(custom ? { ...def, ...custom } : def)
  }
  return result
}

// 生成唯一ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取随机颜色
function getRandomColor() {
  const index = Math.floor(Math.random() * COURSE_COLORS.length)
  return COURSE_COLORS[index]
}

// 计算当前周次
function getCurrentWeek(startDate, totalWeeks) {
  const start = new Date(startDate)
  const now = new Date()
  const diffTime = now - start
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const currentWeek = Math.floor(diffDays / 7) + 1

  if (currentWeek < 1) return 1
  if (currentWeek > totalWeeks) return totalWeeks
  return currentWeek
}

// 根据开学日期和周次，计算本周周一到周日的日期（格式 YYYY-MM-DD）
function getWeekDates(startDate, week, showDays) {
  const start = startDate ? new Date(startDate.replace(/-/g, '/')) : new Date()
  const day = start.getDay() // 0=周日, 1=周一...
  const offset = day === 0 ? -6 : 1 - day
  const firstMonday = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000)
  const monday = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)

  const dates = []
  const days = showDays || 7
  for (let i = 0; i < days; i++) {
    const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dayNum = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${dayNum}`)
  }
  return dates
}

// 将 YYYY-MM-DD 格式化为显示的 month.date
function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parseInt(parts[1], 10)}.${parseInt(parts[2], 10)}`
}

// ====== 节假日 / 调休 ======

// 将 Date 或日期字符串统一格式化为 YYYY-MM-DD
function formatDateKey(date) {
  const d = typeof date === 'string' ? new Date(date.replace(/-/g, '/')) : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 获取 setting 中保存的节假日配置
function getHolidayConfig(settings) {
  const s = settings || getSettings()
  return s.holidayConfig || { holidays: [], workdays: [] }
}

// 获取某一年内置法定节假日
function getBuiltinHolidays(year) {
  return BUILTIN_HOLIDAYS[year] || { holidays: [], workdays: [] }
}

// 将内置节假日合并到用户配置中
function mergeBuiltinHolidays(settings, year) {
  const config = getHolidayConfig(settings)
  const builtin = getBuiltinHolidays(year)
  return {
    holidays: Array.from(new Set([...(config.holidays || []), ...builtin.holidays])).sort(),
    workdays: Array.from(new Set([...(config.workdays || []), ...builtin.workdays])).sort()
  }
}

// 判断某日期状态：'holiday' 放假、'workday' 调休上班、'normal' 正常
function getDateStatus(date, holidayConfig) {
  const key = formatDateKey(date)
  if (!holidayConfig) return 'normal'
  if ((holidayConfig.holidays || []).includes(key)) return 'holiday'
  if ((holidayConfig.workdays || []).includes(key)) return 'workday'
  return 'normal'
}

// 根据本周日期数组返回每天状态
function getDayStatus(dayDates, holidayConfig) {
  return dayDates.map(d => getDateStatus(d, holidayConfig))
}

// 获取指定周次周一至周日的日期与状态
function getWeekDateStatus(startDate, week, holidayConfig) {
  const dayDates = getWeekDates(startDate, week, 7)
  const dayStatus = getDayStatus(dayDates, holidayConfig)
  return { dayDates, dayStatus }
}

// 获取指定周次实际应显示的天数（考虑调休上班日可能落在周末）
function getEffectiveShowDays(showWeekend, dayStatus) {
  const base = showWeekend ? 7 : 5
  const lastWorkDay = dayStatus.reduce((max, s, idx) => s === 'workday' ? Math.max(max, idx + 1) : max, 0)
  return Math.min(7, Math.max(base, lastWorkDay))
}

// 获取指定年份范围内所有内置年份列表
function getBuiltinHolidayYears() {
  return Object.keys(BUILTIN_HOLIDAYS).map(Number).sort((a, b) => a - b)
}

// 获取指定年份是否已有内置数据
function hasBuiltinHolidays(year) {
  return !!BUILTIN_HOLIDAYS[year]
}

// 获取指定周次中因调休需要显示的天数（用于在隐藏周末时仍显示调休日）
function getWorkdayIndices(dayStatus) {
  return dayStatus.reduce((arr, s, idx) => {
    if (s === 'workday') arr.push(idx + 1)
    return arr
  }, [])
}

// 获取指定周次的节假日日期列表
function getHolidayDatesInWeek(dayDates, dayStatus) {
  return dayDates.filter((_, idx) => dayStatus[idx] === 'holiday')
}

// 获取指定周次的调休上班日期列表
function getWorkdayDatesInWeek(dayDates, dayStatus) {
  return dayDates.filter((_, idx) => dayStatus[idx] === 'workday')
}

// 获取指定周次中需要显示课程的天数（正常工作日 + 调休上班日，排除节假日）
function getShowDaysInWeek(showWeekend, dayStatus) {
  const showDays = getEffectiveShowDays(showWeekend, dayStatus)
  return dayStatus.slice(0, showDays).map((s, idx) => ({
    day: idx + 1,
    status: s,
    showCourse: s !== 'holiday'
  }))
}

// 获取指定周次是否需要显示周末（因为有调休上班日落在周末）
function shouldShowWeekend(showWeekend, dayStatus) {
  return getEffectiveShowDays(showWeekend, dayStatus) > 5
}

// 获取指定周次的日期状态摘要（用于显示“本周有X天放假、X天调休”等提示）
function getWeekHolidaySummary(dayDates, dayStatus) {
  const holidays = getHolidayDatesInWeek(dayDates, dayStatus)
  const workdays = getWorkdayDatesInWeek(dayDates, dayStatus)
  return { holidays, workdays }
}

// 获取指定日期所属年份
function getYearOfDate(date) {
  return new Date(typeof date === 'string' ? date.replace(/-/g, '/') : date).getFullYear()
}

// 获取指定年份的所有内置节假日（包括未在学期内的）
function getYearBuiltinHolidays(year) {
  return getBuiltinHolidays(year)
}

// 获取指定年份的节假日配置（仅包含该年份的日期）
function getHolidayConfigForYear(settings, year) {
  const config = getHolidayConfig(settings)
  const prefix = `${year}-`
  return {
    holidays: (config.holidays || []).filter(d => d.startsWith(prefix)),
    workdays: (config.workdays || []).filter(d => d.startsWith(prefix))
  }
}

// 保存节假日配置
function saveHolidayConfig(holidayConfig, semesterId) {
  const settings = getSettings(semesterId)
  settings.holidayConfig = holidayConfig
  return saveSettings(settings, semesterId)
}

// 添加节假日
function addHoliday(date, semesterId) {
  const settings = getSettings(semesterId)
  const config = getHolidayConfig(settings)
  const key = formatDateKey(date)
  if (!config.holidays.includes(key)) {
    config.holidays.push(key)
    config.holidays.sort()
  }
  config.workdays = config.workdays.filter(d => d !== key)
  return saveHolidayConfig(config, semesterId)
}

// 添加调休上班日
function addWorkday(date, semesterId) {
  const settings = getSettings(semesterId)
  const config = getHolidayConfig(settings)
  const key = formatDateKey(date)
  if (!config.workdays.includes(key)) {
    config.workdays.push(key)
    config.workdays.sort()
  }
  config.holidays = config.holidays.filter(d => d !== key)
  return saveHolidayConfig(config, semesterId)
}

// 删除节假日或调休上班日
function removeHolidayOrWorkday(date, semesterId) {
  const settings = getSettings(semesterId)
  const config = getHolidayConfig(settings)
  const key = formatDateKey(date)
  config.holidays = config.holidays.filter(d => d !== key)
  config.workdays = config.workdays.filter(d => d !== key)
  return saveHolidayConfig(config, semesterId)
}

// 获取指定周次的课程
function getCoursesByWeek(courses, week) {
  return courses.filter(course => {
    return course.weeks && course.weeks.includes(week)
  })
}

// 获取指定星期几的课程
function getCoursesByDay(courses, day, week) {
  return courses.filter(course => {
    return course.day === day &&
      course.weeks &&
      course.weeks.includes(week)
  })
}

// 添加课程
function addCourse(courseData) {
  const courses = getCourses()
  const newCourse = {
    id: generateId(),
    ...courseData,
    color: courseData.color || getRandomColor(),
    createdAt: Date.now()
  }
  courses.push(newCourse)
  saveCourses(courses)
  return newCourse
}

// 更新课程
function updateCourse(courseId, courseData) {
  const courses = getCourses()
  const index = courses.findIndex(c => c.id === courseId)
  if (index === -1) return false

  courses[index] = {
    ...courses[index],
    ...courseData,
    updatedAt: Date.now()
  }
  saveCourses(courses)
  return courses[index]
}

// 删除课程
function deleteCourse(courseId) {
  const courses = getCourses()
  const filtered = courses.filter(c => c.id !== courseId)
  saveCourses(filtered)
  return true
}

// 获取课程详情
function getCourseById(courseId) {
  const courses = getCourses()
  return courses.find(c => c.id === courseId)
}

// 检测课程时间冲突，返回第一个冲突的课程，无冲突返回 null
function checkCourseConflict(courseData, excludeId) {
  const courses = getCourses()
  for (const c of courses) {
    if (excludeId && c.id === excludeId) continue
    if (c.day !== courseData.day) continue

    const cEnd = c.startLesson + c.lessonCount
    const newEnd = courseData.startLesson + courseData.lessonCount
    if (courseData.startLesson >= cEnd || newEnd <= c.startLesson) continue

    const hasWeekOverlap = (courseData.weeks || []).some(w => c.weeks && c.weeks.includes(w))
    if (!hasWeekOverlap) continue

    return c
  }
  return null
}

// 格式化周次显示
function formatWeeks(weeks) {
  if (!weeks || weeks.length === 0) return ''

  weeks = [...weeks].sort((a, b) => a - b)

  // 连续周次分组
  const ranges = []
  let start = weeks[0]
  let end = weeks[0]

  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] === end + 1) {
      end = weeks[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = weeks[i]
      end = weeks[i]
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`)

  return ranges.join(', ')
}

// 获取所有周次列表
function getWeeksList(totalWeeks) {
  return Array.from({ length: totalWeeks }, (_, i) => i + 1)
}

// 获取星期几的名称
function getDayName(day) {
  const names = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return names[day] || ''
}

// ====== 课程表导入解析 ======

// 解析周次字符串，支持 "1,2,3"、"1-18"、"1-18(单)"、"1-18 双周" 等
function parseWeeksString(str) {
  if (!str) return []
  str = String(str).trim()
  const oddOnly = /单/.test(str)
  const evenOnly = /双/.test(str)
  const weeks = []
  const parts = str.replace(/[单双周第()（）\s]/g, '').split(/[,，、;；]+/)
  for (const p of parts) {
    if (!p) continue
    const m = p.match(/^(\d+)\s*[-~–]\s*(\d+)$/)
    if (m) {
      const a = parseInt(m[1])
      const b = parseInt(m[2])
      for (let i = a; i <= b; i++) weeks.push(i)
    } else {
      const n = parseInt(p)
      if (!isNaN(n)) weeks.push(n)
    }
  }
  if (oddOnly) return weeks.filter(w => w % 2 === 1)
  if (evenOnly) return weeks.filter(w => w % 2 === 0)
  return weeks
}

// 将导入的原始对象归一化为课程数据结构
function normalizeImportedCourse(item) {
  if (!item || typeof item !== 'object') return null
  const name = (item.name || item.课程名称 || item.课程名 || '').toString().trim()
  if (!name) return null

  const day = parseInt(item.day || item.星期 || item.weekday || 1)
  const startLesson = parseInt(item.startLesson || item.开始节次 || item.start || 1)
  const lessonCount = parseInt(item.lessonCount || item.节数 || item.连续节数 || 2)

  let weeks = item.weeks || item.周次 || item.week
  if (typeof weeks === 'string') weeks = parseWeeksString(weeks)
  if (!Array.isArray(weeks) || weeks.length === 0) weeks = [1]
  weeks = weeks.filter(w => w >= 1 && w <= 30)

  return {
    name,
    teacher: (item.teacher || item.教师 || '').toString().trim(),
    location: (item.location || item.地点 || item.教室 || '').toString().trim(),
    day: (day >= 1 && day <= 7) ? day : 1,
    startLesson: (startLesson >= 1 && startLesson <= 20) ? startLesson : 1,
    lessonCount: (lessonCount >= 1 && lessonCount <= 10) ? lessonCount : 2,
    weeks,
    color: item.color || ''
  }
}

// 解析单行 CSV（支持引号转义）
function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuote) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = false
      } else cur += ch
    } else {
      if (ch === '"') inQuote = true
      else if (ch === ',') { result.push(cur); cur = '' }
      else cur += ch
    }
  }
  result.push(cur)
  return result
}

// 解析 JSON 文本为课程数组
function parseCoursesJSON(content) {
  let data
  try {
    data = typeof content === 'string' ? JSON.parse(content) : content
  } catch (e) {
    return { success: false, error: 'JSON 格式错误：' + e.message }
  }
  if (!Array.isArray(data)) {
    if (data && Array.isArray(data.courses)) data = data.courses
    else return { success: false, error: 'JSON 应为课程数组或包含 courses 字段' }
  }
  const courses = data.map(normalizeImportedCourse).filter(Boolean)
  if (courses.length === 0) return { success: false, error: '未解析到有效课程' }
  return { success: true, courses }
}

// 解析 CSV 文本为课程数组
function parseCoursesCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { success: false, error: 'CSV 内容为空' }
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const courses = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => { row[h] = cols[idx] })
    const c = normalizeImportedCourse(row)
    if (c) courses.push(c)
  }
  if (courses.length === 0) return { success: false, error: '未解析到有效课程' }
  return { success: true, courses }
}

// 根据文件扩展名解析课程数据
function parseCoursesFromFile(filePath, content) {
  const ext = (filePath.split('.').pop() || '').toLowerCase()
  if (ext === 'json') return parseCoursesJSON(content)
  if (ext === 'csv') return parseCoursesCSV(content)
  // 兜底：尝试 JSON 再尝试 CSV
  const jsonRes = parseCoursesJSON(content)
  if (jsonRes.success) return jsonRes
  return parseCoursesCSV(content)
}

module.exports = {
  DEFAULT_SETTINGS,
  COURSE_COLORS,
  getCurrentSemesterId,
  setCurrentSemesterId,
  getSemesters,
  saveSemesters,
  createSemester,
  switchSemester,
  updateSemesterMeta,
  deleteSemester,
  saveCourses,
  getCourses,
  saveSettings,
  getSettings,
  getLessonTimes,
  generateId,
  getRandomColor,
  getCurrentWeek,
  getWeekDates,
  formatDisplayDate,
  getHolidayConfig,
  mergeBuiltinHolidays,
  getDayStatus,
  getEffectiveShowDays,
  getBuiltinHolidayYears,
  addHoliday,
  addWorkday,
  removeHolidayOrWorkday,
  getCoursesByWeek,
  getCoursesByDay,
  addCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
  checkCourseConflict,
  formatWeeks,
  getWeeksList,
  getDayName,
  parseWeeksString,
  normalizeImportedCourse,
  parseCoursesJSON,
  parseCoursesCSV,
  parseCoursesFromFile
}
