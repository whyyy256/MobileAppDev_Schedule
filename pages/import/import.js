// pages/import/import.js
const util = require('../../utils/util.js')

Page({
  data: {
    mode: 'file', // 'file' | 'image'
    imagePath: '', // 图片导入时选中的图片路径
    previewCourses: [], // 待导入的课程列表（未保存）
    settings: {},
    totalWeeks: 18,

    // 编辑弹窗
    showEdit: false,
    editIndex: -1, // -1 表示新增
    // 编辑表单
    courseName: '',
    teacher: '',
    location: '',
    day: 1,
    startLesson: 1,
    lessonCount: 2,
    weeks: [],
    color: '',

    // 选项
    dayOptions: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    lessonOptions: [],
    weekOptions: [],
    colorOptions: util.COURSE_COLORS,

    // picker 弹窗
    showPicker: false,
    pickerMode: '',
    pickerTitle: '',
    pickerOptions: [],
    pickerValue: 1
  },

  onLoad(options) {
    const settings = util.getSettings()
    const totalWeeks = settings.totalWeeks || 18
    const maxLessons = (settings.lessonsPerDay.morning || 4) +
      (settings.lessonsPerDay.afternoon || 4) +
      (settings.lessonsPerDay.evening || 3)

    this.setData({
      settings,
      totalWeeks,
      lessonOptions: Array.from({ length: maxLessons }, (_, i) => i + 1),
      weekOptions: util.getWeeksList(totalWeeks)
    })

    const mode = options.mode === 'image' ? 'image' : 'file'
    this.setData({ mode })

    if (mode === 'file') {
      this.pickFile()
    } else {
      this.pickImage()
    }
  },

  // ====== 文件导入 ======
  pickFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['json', 'csv', 'txt', 'xlsx', 'xls'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        this.readFileAndParse(file.path, file.name)
      },
      fail: () => {
        // 用户取消选择，返回上一页
        this.navigateBackIfEmpty()
      }
    })
  },

  readFileAndParse(filePath, fileName) {
    const ext = (fileName || filePath).split('.').pop().toLowerCase()

    // Excel 为二进制压缩格式，小程序端无法直接解析，提示转为 CSV
    if (ext === 'xlsx' || ext === 'xls') {
      wx.showModal({
        title: '暂不支持 Excel',
        content: 'Excel（.xlsx/.xls）为二进制格式，无法直接解析。请在电脑上将其另存为 CSV 或 JSON 后再导入。',
        showCancel: false,
        success: () => this.navigateBackIfEmpty()
      })
      return
    }

    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'utf-8',
      success: (r) => {
        const content = r.data
        const result = util.parseCoursesFromFile(fileName || filePath, content)
        if (result.success) {
          // 为每条课程补齐颜色
          const courses = result.courses.map(c => ({
            ...c,
            color: c.color || util.getRandomColor()
          }))
          wx.showToast({ title: `识别到 ${courses.length} 门课程`, icon: 'none' })
          this.setData({ previewCourses: courses })
        } else if (result.isBackup) {
          wx.showModal({
            title: '检测到备份文件',
            content: '该文件为完整备份文件，导入后将覆盖当前所有数据，是否继续？',
            success: (res) => {
              if (res.confirm) {
                const backupData = typeof content === 'string' ? JSON.parse(content) : content
                const restoreResult = util.restoreFromBackup(backupData)
                if (restoreResult.success) {
                  wx.showToast({ title: '恢复成功', icon: 'success' })
                  setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 800)
                } else {
                  wx.showModal({
                    title: '恢复失败',
                    content: restoreResult.error || '无法恢复备份',
                    showCancel: false,
                    success: () => this.navigateBackIfEmpty()
                  })
                }
              } else {
                this.navigateBackIfEmpty()
              }
            }
          })
        } else {
          wx.showModal({
            title: '解析失败',
            content: result.error || '无法识别该文件，请检查格式',
            showCancel: false,
            success: () => this.navigateBackIfEmpty()
          })
        }
      },
      fail: () => {
        wx.showModal({
          title: '读取失败',
          content: '无法读取所选文件',
          showCancel: false,
          success: () => this.navigateBackIfEmpty()
        })
      }
    })
  },

  // ====== 图片导入 ======
  pickImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) {
          this.navigateBackIfEmpty()
          return
        }
        this.setData({ imagePath: file.tempFilePath })
        wx.showModal({
          title: '图片导入说明',
          content: '已选择课程表图片，请在下方对照图片手动添加/修正课程信息后确认导入。',
          showCancel: false,
          confirmText: '开始添加'
        })
      },
      fail: () => {
        this.navigateBackIfEmpty()
      }
    })
  },

  navigateBackIfEmpty() {
    if (this.data.previewCourses.length === 0 && !this.data.imagePath) {
      wx.navigateBack()
    }
  },

  // ====== 预览列表操作 ======
  onEditCourse(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const c = this.data.previewCourses[index]
    if (!c) return
    this.setData({
      showEdit: true,
      editIndex: index,
      courseName: c.name,
      teacher: c.teacher,
      location: c.location,
      day: c.day,
      startLesson: c.startLesson,
      lessonCount: c.lessonCount,
      weeks: [...c.weeks],
      color: c.color || util.getRandomColor()
    })
  },

  onDeleteCourse(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const courses = [...this.data.previewCourses]
    courses.splice(index, 1)
    this.setData({ previewCourses: courses })
  },

  onAddCourse() {
    this.setData({
      showEdit: true,
      editIndex: -1,
      courseName: '',
      teacher: '',
      location: '',
      day: 1,
      startLesson: 1,
      lessonCount: 2,
      weeks: [],
      color: util.getRandomColor()
    })
  },

  hideEdit() {
    this.setData({ showEdit: false })
  },

  stopBubbling() {},

  // ====== 编辑表单输入 ======
  onCourseNameInput(e) { this.setData({ courseName: e.detail.value }) },
  onTeacherInput(e) { this.setData({ teacher: e.detail.value }) },
  onLocationInput(e) { this.setData({ location: e.detail.value }) },

  // picker
  showDayPicker() {
    this.setData({
      showPicker: true,
      pickerMode: 'day',
      pickerTitle: '选择星期',
      pickerOptions: this.data.dayOptions.map((label, index) => ({ label, value: index + 1 })),
      pickerValue: this.data.day
    })
  },

  showStartLessonPicker() {
    this.setData({
      showPicker: true,
      pickerMode: 'startLesson',
      pickerTitle: '选择开始节次',
      pickerOptions: this.data.lessonOptions.map(v => ({ label: `第 ${v} 节`, value: v })),
      pickerValue: this.data.startLesson
    })
  },

  showLessonCountPicker() {
    this.setData({
      showPicker: true,
      pickerMode: 'lessonCount',
      pickerTitle: '选择连续节数',
      pickerOptions: this.data.lessonOptions.map(v => ({ label: `${v} 节`, value: v })),
      pickerValue: this.data.lessonCount
    })
  },

  hidePicker() { this.setData({ showPicker: false }) },

  onPickerItemTap(e) {
    this.setData({ pickerValue: parseInt(e.currentTarget.dataset.value) })
  },

  confirmPicker() {
    const { pickerMode, pickerValue } = this.data
    const data = { showPicker: false }
    data[pickerMode] = pickerValue
    this.setData(data)
  },

  // 周次选择
  onWeekToggle(e) {
    const week = parseInt(e.currentTarget.dataset.week)
    const weeks = [...this.data.weeks]
    const index = weeks.indexOf(week)
    if (index > -1) weeks.splice(index, 1)
    else { weeks.push(week); weeks.sort((a, b) => a - b) }
    this.setData({ weeks })
  },

  onSelectAllWeeks() { this.setData({ weeks: [...this.data.weekOptions] }) },
  onOddWeeks() { this.setData({ weeks: this.data.weekOptions.filter(w => w % 2 === 1) }) },
  onEvenWeeks() { this.setData({ weeks: this.data.weekOptions.filter(w => w % 2 === 0) }) },
  onClearWeeks() { this.setData({ weeks: [] }) },

  onColorSelect(e) {
    this.setData({ color: e.currentTarget.dataset.color })
  },

  // 保存编辑（写入预览列表）
  onConfirmEdit() {
    const { courseName, teacher, location, day, startLesson, lessonCount, weeks, color, editIndex } = this.data

    if (!courseName.trim()) {
      wx.showToast({ title: '请输入课程名称', icon: 'none' })
      return
    }
    if (weeks.length === 0) {
      wx.showToast({ title: '请选择上课周次', icon: 'none' })
      return
    }

    const course = {
      name: courseName.trim(),
      teacher: teacher.trim(),
      location: location.trim(),
      day,
      startLesson,
      lessonCount,
      weeks: [...weeks],
      color
    }

    const courses = [...this.data.previewCourses]
    if (editIndex === -1) {
      courses.push(course)
    } else {
      courses[editIndex] = course
    }
    this.setData({ previewCourses: courses, showEdit: false })
  },

  // ====== 确认导入 ======
  onConfirmImport() {
    const courses = this.data.previewCourses
    if (courses.length === 0) {
      wx.showToast({ title: '没有可导入的课程', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认导入',
      content: `将导入 ${courses.length} 门课程到当前学期，是否继续？`,
      success: (res) => {
        if (!res.confirm) return
        let successCount = 0
        courses.forEach(c => {
          util.addCourse(c)
          successCount++
        })
        wx.showToast({ title: `已导入 ${successCount} 门课程`, icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1000)
      }
    })
  },

  onPreviewImageTap() {
    if (this.data.imagePath) {
      wx.previewImage({ urls: [this.data.imagePath] })
    }
  }
})
