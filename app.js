// app.js
const util = require('./utils/util')

App({
  globalData: {
    lastReminderCheck: 0
  },

  onLaunch() {
    this.checkReminders()
  },

  onShow() {
    this.checkReminders()
  },

  checkReminders() {
    const now = Date.now()
    if (now - this.globalData.lastReminderCheck < 2000) return
    this.globalData.lastReminderCheck = now

    try {
      const settings = util.getSettings()
      const currentWeek = util.getCurrentWeek(settings.startDate, settings.totalWeeks)
      const courses = util.getCourses()
      const lessonTimes = util.getLessonTimes()
      util.checkAndShowReminders({ courses, lessonTimes, currentWeek })
    } catch (e) {
      console.error('checkReminders error', e)
    }
  }
})
