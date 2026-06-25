// pages/index/index.js
const util = require('../../utils/util.js')

// 固定尺寸 (rpx)
const TIME_COL_RPX = 100
const HEADER_H_RPX = 96

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
    dayDates: [],
    dayColumns: [],
    sections: [],
    showDays: 7,

    // 各时段节数
    morn: 4,
    afternoon: 4,
    evening: 3,

    // 布局尺寸 (rpx)
    timeColWidth: TIME_COL_RPX,
    headerHeight: HEADER_H_RPX,
    cellHeight: 100,
    dayColWidth: 80,

    // 滚动同步
    hScrollLeft: 0,
    gScrollLeft: 0,

    // 空白格选中态（点第一下出现加号，点第二下进入添加课程）
    selectedCell: null,

    // 课程详情弹窗
    showCourseDetail: false,
    courseDetail: null,

    // 视图模式与日期视图
    viewMode: 'week',
    currentDay: 1,
    dayViewCourses: [],
    dayViewDate: '',

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
    const today = new Date().getDay()
    let currentDay = today === 0 ? 7 : today
    const showWeekend = settings.showWeekend !== false
    const showDays = showWeekend ? 7 : 5
    if (currentDay > showDays) currentDay = showDays

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
      todayWeek: currentWeek,
      currentDay,
      totalWeeks,
      weekOptions,
      showWeekend,
      showDays,
      totalLessons,
      lessonTimes,
      dayHeaders,
      morn,
      afternoon,
      evening
    }, () => {
      this.calcLayout(() => this.buildScheduleData())
    })
  },

  loadCourses() {
    const courses = util.getCourses()
    this.setData({ courses })
    this.buildScheduleData()
  },

  // 从添加课程/设置页返回后重新加载课程与设置
  onShow() {
    this.setData({ selectedCell: null })
    this.loadSettings()
    this.loadCourses()
  },

  buildScheduleData() {
    const { currentWeek, courses, showDays, cellHeight, lessonTimes, morn, afternoon, evening, settings } = this.data
    const dayDates = util.getWeekDates(settings && settings.startDate, currentWeek, showDays)
    const weekCourses = courses.map(c => ({
      ...c,
      isCurrentWeek: !!(c.weeks && c.weeks.includes(currentWeek))
    }))

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

    // 分节：上午 / 下午 / 晚上，并在节间插入午休、晚休条带
    const sectionDefs = [
      { key: 'morning', count: morn, breakName: afternoon > 0 ? '午休' : null },
      { key: 'afternoon', count: afternoon, breakName: evening > 0 ? '晚休' : null },
      { key: 'evening', count: evening, breakName: null }
    ].filter(s => s.count > 0)

    let lessonStart = 1
    const sections = sectionDefs.map(def => {
      const secLessonTimes = lessonTimes.slice(lessonStart - 1, lessonStart - 1 + def.count)
      const sectionEnd = lessonStart + def.count - 1
      const secDayColumns = []

      for (let day = 1; day <= showDays; day++) {
        const dayCourses = weekCourses.filter(c => c.day === day)
        const positioned = []

        for (const c of dayCourses) {
          const courseEnd = c.startLesson + c.lessonCount - 1
          // 当前节段与课程的交集
          const clipStart = Math.max(c.startLesson, lessonStart)
          const clipEnd = Math.min(courseEnd, sectionEnd)
          if (clipStart > clipEnd) continue

          positioned.push({
            ...c,
            top: (clipStart - lessonStart) * cellHeight,
            height: (clipEnd - clipStart + 1) * cellHeight - 3,
            _originalStartLesson: c.startLesson,
            _originalLessonCount: c.lessonCount
          })
        }

        secDayColumns.push({ day, courses: positioned })
      }

      const section = {
        key: def.key,
        breakName: def.breakName,
        lessonTimes: secLessonTimes,
        dayColumns: secDayColumns
      }

      lessonStart += def.count
      return section
    })

    this.setData({ dayDates, dayColumns, sections })
    this.buildDayView()
  },

  buildDayView() {
    const { currentWeek, currentDay, courses, lessonTimes, settings, showDays } = this.data
    const dayDates = util.getWeekDates(settings && settings.startDate, currentWeek, showDays)
    const dayViewDate = dayDates[currentDay - 1] || ''
    const dayCourses = courses.filter(c =>
      c.day === currentDay && c.weeks && c.weeks.includes(currentWeek)
    ).sort((a, b) => a.startLesson - b.startLesson).map(c => {
      const startTime = lessonTimes[c.startLesson - 1]
      const endTime = lessonTimes[c.startLesson + c.lessonCount - 2]
      return {
        ...c,
        timeText: startTime && endTime ? `${startTime.start}-${endTime.end}` : ''
      }
    })
    this.setData({ dayViewCourses: dayCourses, dayViewDate })
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

  // ====== 左右滑动切换周次 ======
  onTableTouchStart(e) {
    this._touchStartX = e.touches[0].clientX
    this._touchStartY = e.touches[0].clientY
  },

  onTableTouchEnd(e) {
    if (!this._touchStartX || !this._touchStartY) return
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const dx = endX - this._touchStartX
    const dy = endY - this._touchStartY
    this._touchStartX = 0
    this._touchStartY = 0

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
      if (dx < 0) this.onNextWeek()
      else this.onPrevWeek()
    }
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
      showWeekPicker: false,
      selectedCell: null
    })
    this.buildScheduleData()
  },

  onPrevWeek() {
    if (this.data.currentWeek > 1) {
      this.setData({ currentWeek: this.data.currentWeek - 1, selectedCell: null })
      this.buildScheduleData()
    }
  },

  onNextWeek() {
    if (this.data.currentWeek < this.data.totalWeeks) {
      this.setData({ currentWeek: this.data.currentWeek + 1, selectedCell: null })
      this.buildScheduleData()
    }
  },

  onToggleView() {
    const viewMode = this.data.viewMode === 'week' ? 'day' : 'week'
    this.setData({ viewMode })
    if (viewMode === 'day') this.buildDayView()
  },

  onPrevDay() {
    if (this.data.currentDay > 1) {
      this.setData({ currentDay: this.data.currentDay - 1 })
      this.buildDayView()
    }
  },

  onNextDay() {
    if (this.data.currentDay < this.data.showDays) {
      this.setData({ currentDay: this.data.currentDay + 1 })
      this.buildDayView()
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
      this.setData({
        showCourseDetail: true,
        courseDetail: {
          ...course,
          weeksText: util.formatWeeks(course.weeks)
        }
      })
    }
  },

  hideCourseDetail() {
    this.setData({ showCourseDetail: false, courseDetail: null })
  },

  onEditCourseDetail() {
    const course = this.data.courseDetail
    this.setData({ showCourseDetail: false })
    if (course) {
      wx.navigateTo({ url: `/pages/addCourse/addCourse?id=${course.id}` })
    }
  },

  onEmptyCellTap(e) {
    const day = parseInt(e.currentTarget.dataset.day)
    const lesson = parseInt(e.currentTarget.dataset.lesson)
    const selected = this.data.selectedCell
    if (selected && selected.day === day && selected.lesson === lesson) {
      this.setData({ selectedCell: null })
      wx.navigateTo({
        url: `/pages/addCourse/addCourse?day=${day}&startLesson=${lesson}`
      })
    } else {
      this.setData({ selectedCell: { day, lesson } })
    }
  },

  onSettingsTap() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  onAddCourse() {
    wx.navigateTo({ url: '/pages/addCourse/addCourse' })
  },

  onImportTap() {
    wx.showActionSheet({
      itemList: ['从文件导入（Excel/CSV/JSON）', '从图片导入（OCR 识别）'],
      success: (res) => {
        const mode = res.tapIndex === 1 ? 'image' : 'file'
        wx.navigateTo({ url: `/pages/import/import?mode=${mode}` })
      }
    })
  }
})
