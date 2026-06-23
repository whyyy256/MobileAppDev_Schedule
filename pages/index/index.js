// pages/index/index.js
const util = require('../../utils/util.js')

Page({
  data: {
    currentWeek: 1,
    totalWeeks: 18,
    showWeekend: true,
    settings: {},
    courses: [],
    scheduleData: [], // 课程表网格数据
    lessonNumbers: [], // 节次列表
    showDays: 5, // 显示天数
    dayHeaders: [] // 星期标题
  },

  onLoad() {
    this.loadSettings()
    this.loadCourses()
  },

  onShow() {
    this.loadCourses()
  },

  // 加载设置
  loadSettings() {
    const settings = util.getSettings()
    const currentWeek = util.getCurrentWeek(settings.startDate, settings.totalWeeks)
    const showDays = settings.showWeekend ? 7 : 5

    // 生成节次列表
    const totalLessons = (settings.lessonsPerDay.morning || 4) +
      (settings.lessonsPerDay.afternoon || 4) +
      (settings.lessonsPerDay.evening || 3)
    const lessonNumbers = Array.from({ length: totalLessons }, (_, i) => i + 1)

    // 生成星期标题
    const allDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const dayHeaders = allDays.slice(0, showDays)

    this.setData({
      settings,
      currentWeek,
      totalWeeks: settings.totalWeeks || 18,
      showWeekend: settings.showWeekend !== false,
      showDays,
      lessonNumbers,
      dayHeaders
    })

    this.buildScheduleData()
  },

  // 加载课程
  loadCourses() {
    const courses = util.getCourses()
    this.setData({ courses })
    this.buildScheduleData()
  },

  // 构建课程表数据
  buildScheduleData() {
    const { currentWeek, settings, courses } = this.data
    const showDays = settings.showWeekend ? 7 : 5
    const totalLessons = (settings.lessonsPerDay.morning || 4) +
      (settings.lessonsPerDay.afternoon || 4) +
      (settings.lessonsPerDay.evening || 3)

    // 获取本周课程
    const weekCourses = util.getCoursesByWeek(courses, currentWeek)

    // 构建网格数据
    const scheduleData = []
    for (let day = 1; day <= showDays; day++) {
      const dayCourses = weekCourses.filter(c => c.day === day)
      const cells = []

      for (let lesson = 1; lesson <= totalLessons; lesson++) {
        // 查找该节次是否有课程
        const course = dayCourses.find(c =>
          lesson >= c.startLesson &&
          lesson < c.startLesson + c.lessonCount
        )

        if (course && lesson === course.startLesson) {
          // 课程开始节次
          cells.push({
            course,
            rowSpan: course.lessonCount
          })
        } else if (!course) {
          // 空单元格
          cells.push({ course: null, rowSpan: 1 })
        }
        // 其他情况不添加（被 rowSpan 覆盖）
      }

      scheduleData.push({ day, cells })
    }

    this.setData({ scheduleData })
  },

  // 切换周次
  onWeekChange(e) {
    const week = parseInt(e.detail.value) + 1
    this.setData({ currentWeek: week })
    this.buildScheduleData()
  },

  // 上一周
  onPrevWeek() {
    const { currentWeek } = this.data
    if (currentWeek > 1) {
      this.setData({ currentWeek: currentWeek - 1 })
      this.buildScheduleData()
    }
  },

  // 下一周
  onNextWeek() {
    const { currentWeek, totalWeeks } = this.data
    if (currentWeek < totalWeeks) {
      this.setData({ currentWeek: currentWeek + 1 })
      this.buildScheduleData()
    }
  },

  // 课程点击
  onCourseTap(e) {
    const course = e.currentTarget.dataset.course
    if (course) {
      wx.navigateTo({
        url: `/pages/addCourse/addCourse?id=${course.id}`
      })
    }
  },

  // 添加课程
  onAddCourse() {
    wx.navigateTo({
      url: '/pages/addCourse/addCourse'
    })
  }
})
