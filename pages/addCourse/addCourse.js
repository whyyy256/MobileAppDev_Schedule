// pages/addCourse/addCourse.js
const util = require('../../utils/util.js')

Page({
  data: {
    // 表单数据
    courseName: '',
    teacher: '',
    location: '',
    day: 1, // 星期几 (1-7)
    startLesson: 1, // 开始节次
    lessonCount: 2, // 连续几节
    weeks: [], // 上课周次
    color: '',

    // 选项数据
    dayOptions: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    lessonOptions: [],
    weekOptions: [],
    colorOptions: util.COURSE_COLORS,

    // 编辑模式
    isEdit: false,
    courseId: '',

    // 设置
    settings: {},
    maxLessons: 12
  },

  onLoad(options) {
    const settings = util.getSettings()
    const maxLessons = (settings.lessonsPerDay.morning || 4) +
      (settings.lessonsPerDay.afternoon || 4) +
      (settings.lessonsPerDay.evening || 3)

    const weekOptions = util.getWeeksList(settings.totalWeeks || 18)

    this.setData({
      settings,
      maxLessons,
      lessonOptions: Array.from({ length: maxLessons }, (_, i) => i + 1),
      weekOptions
    })

    // 编辑模式
    if (options.id) {
      const course = util.getCourseById(options.id)
      if (course) {
        this.setData({
          isEdit: true,
          courseId: course.id,
          courseName: course.name || '',
          teacher: course.teacher || '',
          location: course.location || '',
          day: course.day || 1,
          startLesson: course.startLesson || 1,
          lessonCount: course.lessonCount || 2,
          weeks: course.weeks || [],
          color: course.color || ''
        })
        wx.setNavigationBarTitle({ title: '编辑课程' })
      }
    } else {
      // 新增模式，设置默认颜色，并接收从首页传入的星期和节次
      const defaults = { color: util.getRandomColor() }
      const presetDay = parseInt(options.day)
      const presetStart = parseInt(options.startLesson)
      if (presetDay >= 1 && presetDay <= 7) defaults.day = presetDay
      if (presetStart >= 1 && presetStart <= maxLessons) defaults.startLesson = presetStart
      this.setData(defaults)
    }
  },

  // 课程名称
  onCourseNameInput(e) {
    this.setData({ courseName: e.detail.value })
  },

  // 教师
  onTeacherInput(e) {
    this.setData({ teacher: e.detail.value })
  },

  // 地点
  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  // 星期几
  onDayChange(e) {
    this.setData({ day: parseInt(e.detail.value) + 1 })
  },

  // 开始节次
  onStartLessonChange(e) {
    this.setData({ startLesson: parseInt(e.detail.value) + 1 })
  },

  // 连续节数
  onLessonCountChange(e) {
    this.setData({ lessonCount: parseInt(e.detail.value) + 1 })
  },

  // 选择周次
  onWeekToggle(e) {
    const week = parseInt(e.currentTarget.dataset.week)
    const weeks = [...this.data.weeks]
    const index = weeks.indexOf(week)

    if (index > -1) {
      weeks.splice(index, 1)
    } else {
      weeks.push(week)
      weeks.sort((a, b) => a - b)
    }

    this.setData({ weeks })
  },

  // 全选周次
  onSelectAllWeeks() {
    this.setData({ weeks: [...this.data.weekOptions] })
  },

  // 清空周次
  onClearWeeks() {
    this.setData({ weeks: [] })
  },

  // 选择颜色
  onColorSelect(e) {
    const color = e.currentTarget.dataset.color
    this.setData({ color })
  },

  // 快速选择单双周
  onOddWeeks() {
    const weeks = this.data.weekOptions.filter(w => w % 2 === 1)
    this.setData({ weeks })
  },

  onEvenWeeks() {
    const weeks = this.data.weekOptions.filter(w => w % 2 === 0)
    this.setData({ weeks })
  },

  // 保存
  onSave() {
    const { courseName, teacher, location, day, startLesson, lessonCount, weeks, color, isEdit, courseId, maxLessons } = this.data

    // 验证
    if (!courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' })
      return
    }

    if (weeks.length === 0) {
      wx.showToast({ title: '请选择上课周次', icon: 'none' })
      return
    }

    if (startLesson + lessonCount - 1 > maxLessons) {
      wx.showToast({ title: '节次超出范围', icon: 'none' })
      return
    }

    const courseData = {
      name: courseName.trim(),
      teacher: teacher.trim(),
      location: location.trim(),
      day,
      startLesson,
      lessonCount,
      weeks,
      color
    }

    if (isEdit) {
      util.updateCourse(courseId, courseData)
      wx.showToast({ title: '保存成功', icon: 'success' })
    } else {
      util.addCourse(courseData)
      wx.showToast({ title: '添加成功', icon: 'success' })
    }

    setTimeout(() => {
      wx.navigateBack()
    }, 1000)
  },

  // 删除课程
  onDelete() {
    if (!this.data.isEdit) return

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这门课程吗？',
      success: (res) => {
        if (res.confirm) {
          util.deleteCourse(this.data.courseId)
          wx.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1000)
        }
      }
    })
  }
})
