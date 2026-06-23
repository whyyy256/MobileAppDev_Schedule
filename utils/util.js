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
  getCoursesByWeek,
  getCoursesByDay,
  addCourse,
  updateCourse,
  deleteCourse,
  getCourseById,
  formatWeeks,
  getWeeksList,
  getDayName
}
