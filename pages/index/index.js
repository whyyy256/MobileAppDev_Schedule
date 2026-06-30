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
    dayDateTexts: [],
    dayStatus: [],
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
    dayViewIsHoliday: false,

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
    hourScrollTop: 0,
    minuteScrollTop: 0,
    hours: Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
    minutes: Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),

    // 个性化设置
    backgroundImage: '',
    darkModeActive: false,

    // 分享卡片
    showShareCard: false,
    shareImagePath: ''
  },

  _syncing: false,

  onLoad() {
    this.loadSettings()
    this.loadCourses()
    this.listenThemeChange()
  },

  listenThemeChange() {
    if (!wx.onThemeChange) return
    wx.onThemeChange(({ theme }) => {
      const settings = this.data.settings
      if (settings && settings.darkMode === 'auto') {
        this.setData({ darkModeActive: theme === 'dark' })
      }
    })
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
    const backgroundImage = settings.backgroundImage || ''
    const darkModeActive = util.isDarkModeEnabled(settings)

    this.setData({
      settings,
      currentWeek,
      todayWeek: currentWeek,
      currentDay,
      totalWeeks,
      weekOptions,
      showWeekend,
      totalLessons,
      lessonTimes,
      morn,
      afternoon,
      evening,
      backgroundImage,
      darkModeActive
    }, () => {
      this.buildScheduleData()
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
    getApp().checkReminders()
  },

  buildScheduleData() {
    const { currentWeek, courses, showWeekend, lessonTimes, morn, afternoon, evening, settings } = this.data
    const holidayConfig = util.getHolidayConfig(settings)
    const fullDayDates = util.getWeekDates(settings && settings.startDate, currentWeek, 7)
    const fullDayStatus = util.getDayStatus(fullDayDates, holidayConfig)
    const showDays = util.getEffectiveShowDays(showWeekend, fullDayStatus)
    const dayDates = fullDayDates.slice(0, showDays)
    const dayDateTexts = dayDates.map(d => util.formatDisplayDate(d))
    const dayStatus = fullDayStatus.slice(0, showDays)
    const allDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const dayHeaders = allDays.slice(0, showDays)

    this.setData({ showDays, dayDates, dayDateTexts, dayStatus, dayHeaders }, () => {
      this.calcLayout(() => {
        const { cellHeight } = this.data
        const weekCourses = courses.map(c => ({
          ...c,
          isCurrentWeek: !!(c.weeks && c.weeks.includes(currentWeek))
        }))

        // 调休上班日若指定了补课周几，则显示对应周的课程
        const resolveCourseDay = (day) => {
          if (dayStatus[day - 1] !== 'workday') return day
          const makeupDay = util.getWorkdayMakeupDay(dayDates[day - 1], holidayConfig)
          return (makeupDay >= 1 && makeupDay <= 7) ? makeupDay : day
        }

        const dayColumns = []
        for (let day = 1; day <= showDays; day++) {
          const courseDay = resolveCourseDay(day)
          const dayCourses = weekCourses.filter(c => c.day === courseDay && dayStatus[day - 1] !== 'holiday')
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
            const courseDay = resolveCourseDay(day)
            const dayCourses = weekCourses.filter(c => c.day === courseDay && dayStatus[day - 1] !== 'holiday')
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

        this.setData({ dayColumns, sections })
        this.buildDayView()
      })
    })
  },

  buildDayView() {
    const { currentWeek, currentDay, courses, lessonTimes, settings, showDays, dayStatus, dayDates } = this.data
    const holidayConfig = util.getHolidayConfig(settings)
    let dayViewDate = ''
    let isHoliday = false
    let courseDay = currentDay
    if (currentDay >= 1 && currentDay <= showDays) {
      dayViewDate = util.formatDisplayDate(dayDates[currentDay - 1])
      isHoliday = dayStatus[currentDay - 1] === 'holiday'
      if (dayStatus[currentDay - 1] === 'workday') {
        const makeupDay = util.getWorkdayMakeupDay(dayDates[currentDay - 1], holidayConfig)
        if (makeupDay >= 1 && makeupDay <= 7) courseDay = makeupDay
      }
    }
    const dayCourses = isHoliday ? [] : courses.filter(c =>
      c.day === courseDay && c.weeks && c.weeks.includes(currentWeek)
    ).sort((a, b) => a.startLesson - b.startLesson).map(c => {
      const startTime = lessonTimes[c.startLesson - 1]
      const endTime = lessonTimes[c.startLesson + c.lessonCount - 2]
      return {
        ...c,
        timeText: startTime && endTime ? `${startTime.start}-${endTime.end}` : ''
      }
    })
    this.setData({ dayViewCourses: dayCourses, dayViewDate, dayViewIsHoliday: isHoliday })
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

  computeTimeScrollTop(index, totalCount) {
    const itemHeightRpx = 80
    const maxScrollRpx = Math.max(0, (totalCount - 1) * itemHeightRpx)
    const scrollRpx = Math.max(0, Math.min(maxScrollRpx, index * itemHeightRpx))
    const systemInfo = wx.getSystemInfoSync()
    return scrollRpx * systemInfo.screenWidth / 750
  },

  onEditStartTap() {
    const [hour, minute] = this.data.editStart.split(':')
    const hourIndex = parseInt(hour, 10)
    const minuteIndex = parseInt(minute, 10)
    this.setData({
      showTimeSelect: true,
      timeSelectMode: 'start',
      selectHour: hour,
      selectMinute: minute,
      hourScrollTop: 0,
      minuteScrollTop: 0
    }, () => {
      setTimeout(() => {
        this.setData({
          hourScrollTop: this.computeTimeScrollTop(hourIndex, 24),
          minuteScrollTop: this.computeTimeScrollTop(minuteIndex, 60)
        })
      }, 50)
    })
  },

  onEditEndTap() {
    const [hour, minute] = this.data.editEnd.split(':')
    const hourIndex = parseInt(hour, 10)
    const minuteIndex = parseInt(minute, 10)
    this.setData({
      showTimeSelect: true,
      timeSelectMode: 'end',
      selectHour: hour,
      selectMinute: minute,
      hourScrollTop: 0,
      minuteScrollTop: 0
    }, () => {
      setTimeout(() => {
        this.setData({
          hourScrollTop: this.computeTimeScrollTop(hourIndex, 24),
          minuteScrollTop: this.computeTimeScrollTop(minuteIndex, 60)
        })
      }, 50)
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
    }, () => {
      // 刷新课程表，确保课程卡片上的时间段同步更新
      this.buildScheduleData()
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
          weeksText: util.formatWeeks(course.weeks),
          notes: course.notes || ''
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
    wx.navigateTo({ url: '/pages/import/import?mode=file' })
  },

  // ====== 分享课程表 ======
  onShareTap() {
    this.setData({ showShareCard: true, shareImagePath: '' })
    this.generateShareCard()
  },

  hideShareCard() {
    this.setData({ showShareCard: false, shareImagePath: '' })
  },

  generateShareCard() {
    const query = wx.createSelectorQuery().in(this)
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) {
        wx.showToast({ title: '生成失败', icon: 'none' })
        return
      }
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      // 限制缩放比例与高度，避免画布过大导致导出超时
      const dpr = Math.min(wx.getSystemInfoSync().pixelRatio || 1, 2)
      const height = Math.min(this.computeShareCardHeight(), 2000)
      canvas.width = 750 * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      this.drawShareCard(ctx, height)
      // 延迟导出，确保渲染完成
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvas,
          fileType: 'jpg',
          quality: 0.9,
          success: (fileRes) => {
            this.setData({ shareImagePath: fileRes.tempFilePath })
          },
          fail: (err) => {
            console.error('canvasToTempFilePath fail', err)
            wx.showToast({ title: '生成失败，请重试', icon: 'none' })
          }
        })
      }, 100)
    })
  },

  computeShareCardHeight() {
    const courses = this.data.courses || []
    const currentWeek = this.data.currentWeek || 1
    const weekCourses = courses.filter(c => c.weeks && c.weeks.includes(currentWeek))
    let contentHeight = 300
    if (weekCourses.length === 0) return 800
    const groups = {}
    for (let d = 1; d <= 7; d++) groups[d] = []
    weekCourses.forEach(c => { if (groups[c.day]) groups[c.day].push(c) })
    for (let d = 1; d <= 7; d++) {
      const list = groups[d].sort((a, b) => a.startLesson - b.startLesson)
      if (!list.length) continue
      contentHeight += 70
      contentHeight += list.length * 130
      contentHeight += 20
    }
    return Math.max(800, contentHeight + 80)
  },

  drawShareCard(ctx, height) {
    const settings = this.data.settings || {}
    const courses = this.data.courses || []
    const currentWeek = this.data.currentWeek || 1
    const semesterName = settings.semesterName || '我的课程表'
    const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

    // 背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 750, height)

    // 顶部装饰条
    ctx.fillStyle = '#07c160'
    ctx.fillRect(0, 0, 750, 8)

    // 标题
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 54px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(semesterName, 50, 90)

    ctx.fillStyle = '#07c160'
    ctx.font = '36px sans-serif'
    ctx.fillText(`第 ${currentWeek} 周课程表`, 50, 150)

    // 日期范围
    const startDate = settings.startDate
    let dateText = ''
    if (startDate) {
      const start = new Date(startDate.replace(/-/g, '/'))
      const weekMs = (currentWeek - 1) * 7 * 24 * 60 * 60 * 1000
      const weekStart = new Date(start.getTime() + weekMs)
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
      const fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`
      dateText = `${fmt(weekStart)} ~ ${fmt(weekEnd)}`
    }
    ctx.fillStyle = '#999999'
    ctx.font = '26px sans-serif'
    ctx.fillText(dateText, 50, 200)

    // 分隔线
    ctx.strokeStyle = '#eeeeee'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, 230)
    ctx.lineTo(700, 230)
    ctx.stroke()

    let y = 270
    const weekCourses = courses.filter(c => c.weeks && c.weeks.includes(currentWeek))

    if (weekCourses.length === 0) {
      ctx.fillStyle = '#999999'
      ctx.font = '32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('本周暂无课程', 375, y + 100)
      return
    }

    const groups = {}
    for (let d = 1; d <= 7; d++) groups[d] = []
    weekCourses.forEach(c => { if (groups[c.day]) groups[c.day].push(c) })

    for (let d = 1; d <= 7; d++) {
      const list = groups[d].sort((a, b) => a.startLesson - b.startLesson)
      if (!list.length) continue

      // 星期标题
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(dayNames[d - 1], 50, y + 42)
      y += 70

      list.forEach(c => {
        // 卡片背景
        ctx.fillStyle = '#f8f8f8'
        this.roundRect(ctx, 50, y, 650, 110, 16)
        ctx.fill()

        // 彩色左侧条
        ctx.fillStyle = c.color || '#07c160'
        this.roundRect(ctx, 50, y, 12, 110, { tl: 16, tr: 0, br: 0, bl: 16 })
        ctx.fill()

        // 课程名
        ctx.fillStyle = '#333333'
        ctx.font = 'bold 32px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(this.ellipsisText(c.name, 16), 82, y + 50)

        // 节次
        ctx.fillStyle = '#666666'
        ctx.font = '24px sans-serif'
        ctx.fillText(`第 ${c.startLesson}-${c.startLesson + c.lessonCount - 1} 节`, 82, y + 85)

        // 教师/地点
        const meta = [c.teacher, c.location].filter(Boolean).join(' · ')
        if (meta) {
          ctx.fillStyle = '#888888'
          ctx.font = '24px sans-serif'
          ctx.textAlign = 'right'
          ctx.fillText(this.ellipsisText(meta, 18), 680, y + 85)
        }

        y += 130
      })

      y += 20
    }

    // 底部水印
    ctx.fillStyle = '#cccccc'
    ctx.font = '22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('课程表小程序', 375, height - 30)
  },

  roundRect(ctx, x, y, w, h, r) {
    const radius = typeof r === 'number'
      ? { tl: r, tr: r, br: r, bl: r }
      : { tl: 0, tr: 0, br: 0, bl: 0, ...r }
    ctx.beginPath()
    ctx.moveTo(x + radius.tl, y)
    ctx.lineTo(x + w - radius.tr, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr)
    ctx.lineTo(x + w, y + h - radius.br)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h)
    ctx.lineTo(x + radius.bl, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl)
    ctx.lineTo(x, y + radius.tl)
    ctx.quadraticCurveTo(x, y, x + radius.tl, y)
    ctx.closePath()
  },

  ellipsisText(str, maxLen) {
    if (!str) return ''
    let len = 0
    for (let i = 0; i < str.length; i++) {
      len += str.charCodeAt(i) > 127 ? 2 : 1
      if (len > maxLen * 2) return str.slice(0, i) + '…'
    }
    return str
  },

  onShareToFriend() {
    const path = this.data.shareImagePath
    if (!path) return
    if (wx.showShareImageMenu) {
      wx.showShareImageMenu({ path })
    } else {
      wx.previewImage({ urls: [path] })
    }
  },

  onSaveShareImage() {
    const path = this.data.shareImagePath
    if (!path) return
    wx.saveImageToPhotosAlbum({
      filePath: path,
      success: () => wx.showToast({ title: '已保存', icon: 'success' }),
      fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
    })
  }
})
