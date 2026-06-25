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

// 根据开学日期和周次，计算本周周一到周日的日期（格式 month.date）
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
    dates.push(`${d.getMonth() + 1}.${d.getDate()}`)
  }
  return dates
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
