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

// 保存课程列表
function saveCourses(courses) {
  try {
    wx.setStorageSync('courses', courses)
    return true
  } catch (e) {
    console.error('保存课程失败', e)
    return false
  }
}

// 获取课程列表
function getCourses() {
  try {
    return wx.getStorageSync('courses') || []
  } catch (e) {
    console.error('读取课程失败', e)
    return []
  }
}

// 保存设置
function saveSettings(settings) {
  try {
    wx.setStorageSync('settings', settings)
    return true
  } catch (e) {
    console.error('保存设置失败', e)
    return false
  }
}

// 获取设置
function getSettings() {
  try {
    const settings = wx.getStorageSync('settings')
    return settings || DEFAULT_SETTINGS
  } catch (e) {
    console.error('读取设置失败', e)
    return DEFAULT_SETTINGS
  }
}

// 获取完整的课程时间表（合并用户自定义与默认）
function getLessonTimes(settings) {
  const s = settings || getSettings()
  const defaults = DEFAULT_SETTINGS.lessonTimes
  const customs = s.lessonTimes || []

  return defaults.map(def => {
    const custom = customs.find(c => c.lesson === def.lesson)
    return custom ? { ...def, ...custom } : def
  })
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
