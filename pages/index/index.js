// pages/index/index.js
const util = require('../../utils/util.js')

// 固定尺寸 (rpx)
const TIME_COL_RPX = 100
const HEADER_H_RPX = 64

Page({
  data: {
    currentWeek: 1,
    totalWeeks: 18,
    weekOptions: [],
    showWeekend: true,
    settings: {},
    courses: [],

    totalLessons: 11,
    lessonTimes: [],
    dayHeaders: [],
    dayColumns: [],
    showDays: 7,

    // 布局尺寸 (rpx)
    timeColWidth: TIME_COL_RPX,
    headerHeight: HEADER_H_RPX,
    cellHeight: 100,
    dayColWidth: 80,

    // 滚动同步
    hScrollLeft: 0,
    gScrollLeft: 0,

    // 自定义周次选择弹窗
    showWeekPicker: false,
    pickerValue: [0],
    tempWeek: 1,

    // 时间编辑弹窗
    showTimeEdit: false,
    editLesson: 1,
    editStart: '08:00',
    editEnd: '08:45',

    // 自定义时间选择弹窗
    showTimeSelect: false,
    timeSelectMode: 'start', // 'start' 或 'end'
    selectHour: '08',
    selectMinute: '00',
    hours: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
    minutes: Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  },

  _syncing: false,

  onLoad() {
    this.loadSettings()
    this.loadCourses()
  },

  onShow() {
    this.loadCourses()
  },

  // 根据屏幕尺寸计算每天列宽和每节课高度，使表格刚好铺满屏幕
  calcLayout(cb) {
    try {
      const info = wx.getSystemInfoSync()
      const screenW = info.windowWidth
      const screenH = info.windowHeight
      const statusH = info.statusBarHeight || 0

      // 自定义导航栏高度估算 = 状态栏 + 44px
      const navHeightPx = statusH + 44

      // 时间列宽
      const timeColPx = TIME_COL_RPX * screenW / 750
      // 表头高度
      const headerPx = HEADER_H_RPX * screenW / 750

      // 可用宽度（铺满屏幕两侧）
      const remainWPx = screenW - timeColPx
      const showDays = this.data.showDays || 7
      const dayColRpx = Math.max(60, Math.floor(remainWPx * 750 / screenW / showDays))

      const totalLessons = this.data.totalLessons || 11
      let finalCellH

      if (totalLessons > 10) {
        // 节数较多时优先保证每格大小，允许表格上下滚动
        finalCellH = 120
      } else {
        // 可用高度 = 屏幕高 - 导航栏 - 表头（不再减去周次条/安全区，让表格充满屏幕）
        const availableHPx = screenH - navHeightPx - headerPx
        const cellHeightRpx = Math.floor(availableHPx * 750 / screenW / totalLessons)
        // 最小要保证文字放得下，最大按实际可用空间
        finalCellH = Math.max(86, Math.min(200, cellHeightRpx))
      }

      this.setData({ dayColWidth: dayColRpx, cellHeight: finalCellH }, cb)
    } catch (e) {
      this.setData({ dayColWidth: 80, cellHeight: 100 }, cb)
    }
  },

  loadSettings() {
    const settings = util.getSettings()
    const currentWeek = util.getCurrentWeek(settings.startDate, settings.totalWeeks)
    const showWeekend = settings.showWeekend !== false
    const showDays = showWeekend ? 7 : 5

    const morn = settings.lessonsPerDay.morning || 4
    const afternoon = settings.lessonsPerDay.afternoon || 4
    const evening = settings.lessonsPerDay.evening || 3
    const totalLessons = morn + afternoon + evening

    // 从 settings 读取自定义时间表，并与默认时长合并
    const lessonTimes = util.getLessonTimes(settings).slice(0, totalLessons)
    const allDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const dayHeaders = allDays.slice(0, showDays)

    const totalWeeks = settings.totalWeeks || 18
    const weekOptions = Array.from({ length: totalWeeks }, (_, i) => `第 ${i + 1} 周`)

    this.setData({
      settings,
      currentWeek,
      totalWeeks,
      weekOptions,
      showWeekend,
      showDays,
      totalLessons,
      lessonTimes,
      dayHeaders
    }, () => {
      this.calcLayout(() => this.buildScheduleData())
    })
  },

  loadCourses() {
    const courses = util.getCourses()
    this.setData({ courses })
    this.buildScheduleData()
  },

  // 从设置页返回后需要重新加载
  onShow() {
    this.loadSettings()
  },

  buildScheduleData() {
    const { currentWeek, courses, showDays, cellHeight } = this.data
    const weekCourses = util.getCoursesByWeek(courses, currentWeek)

    const dayColumns = []
    for (let day = 1; day <= showDays; day++) {
      const dayCourses = weekCourses.filter(c => c.day === day)
      const positioned = dayCourses.map(c => ({
        ...c,
        top: (c.startLesson - 1) * cellHeight,
        height: c.lessonCount * cellHeight - 3
      }))
      dayColumns.push({ day, courses: positioned })
    }

    this.setData({ dayColumns })
  },

  // ====== 滚动同步 ======
  onGridScroll(e) {
    if (this._syncing) return
    this._syncing = true
    this.setData({ hScrollLeft: e.detail.scrollLeft }, () => {
      this._syncing = false
    })
  },

  onHeaderScroll(e) {
    if (this._syncing) return
    this._syncing = true
    this.setData({ gScrollLeft: e.detail.scrollLeft }, () => {
      this._syncing = false
    })
  },

  // ====== 周次 ======
  showWeekPicker() {
    const pickerValue = [this.data.currentWeek - 1]
    this.setData({
      showWeekPicker: true,
      pickerValue,
      tempWeek: this.data.currentWeek
    })
  },

  hideWeekPicker() {
    this.setData({ showWeekPicker: false })
  },

  stopBubbling() {},

  onWeekItemTap(e) {
    const week = parseInt(e.currentTarget.dataset.week)
    this.setData({ tempWeek: week })
  },

  confirmWeek() {
    this.setData({
      currentWeek: this.data.tempWeek,
      showWeekPicker: false
    })
    this.buildScheduleData()
  },

  onPrevWeek() {
    if (this.data.currentWeek > 1) {
      this.setData({ currentWeek: this.data.currentWeek - 1 })
      this.buildScheduleData()
    }
  },

  onNextWeek() {
    if (this.data.currentWeek < this.data.totalWeeks) {
      this.setData({ currentWeek: this.data.currentWeek + 1 })
      this.buildScheduleData()
    }
  },

  // ====== 时间编辑 ======
  onTimeCellTap(e) {
    const lesson = parseInt(e.currentTarget.dataset.lesson)
    const item = this.data.lessonTimes.find(t => t.lesson === lesson)
    if (!item) return

    this.setData({
      showTimeEdit: true,
      editLesson: lesson,
      editStart: item.start,
      editEnd: item.end
    })
  },

  hideTimeEdit() {
    this.setData({ showTimeEdit: false })
  },

  onEditStartTap() {
    const [hour, minute] = this.data.editStart.split(':')
    this.setData({
      showTimeSelect: true,
      timeSelectMode: 'start',
      selectHour: hour,
      selectMinute: minute
    })
  },

  onEditEndTap() {
    const [hour, minute] = this.data.editEnd.split(':')
    this.setData({
      showTimeSelect: true,
      timeSelectMode: 'end',
      selectHour: hour,
      selectMinute: minute
    })
  },

  hideTimeSelect() {
    this.setData({ showTimeSelect: false })
  },

  onTimeSelectItemTap(e) {
    const { value, type } = e.currentTarget.dataset
    if (type === 'hour') {
      this.setData({ selectHour: value })
    } else {
      this.setData({ selectMinute: value })
    }
  },

  confirmTimeSelect() {
    const { timeSelectMode, selectHour, selectMinute } = this.data
    const time = `${selectHour}:${selectMinute}`
    if (timeSelectMode === 'start') {
      this.setData({ editStart: time, showTimeSelect: false })
    } else {
      this.setData({ editEnd: time, showTimeSelect: false })
    }
  },

  confirmTimeEdit() {
    const { editLesson, editStart, editEnd, lessonTimes, settings } = this.data

    const newLessonTimes = lessonTimes.map(t => {
      if (t.lesson === editLesson) {
        return { ...t, start: editStart, end: editEnd }
      }
      return t
    })

    const newSettings = { ...settings, lessonTimes: newLessonTimes }
    util.saveSettings(newSettings)

    this.setData({
      settings: newSettings,
      lessonTimes: newLessonTimes,
      showTimeEdit: false
    })
  },

  // ====== 课程操作 ======
  onCourseTap(e) {
    const course = e.currentTarget.dataset.course
    if (course) {
      wx.navigateTo({ url: `/pages/addCourse/addCourse?id=${course.id}` })
    }
  },

  onSettingsTap() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  onAddCourse() {
    wx.navigateTo({ url: '/pages/addCourse/addCourse' })
  }
})
