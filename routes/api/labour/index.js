const router = require('express').Router()
const controller = require('./labour.controller')

router.get('/list/:month', controller.list)
router.get('/delete/:id', controller.deleteLabour)
router.post('/update/:id', controller.updateLabour)
router.post('/salary/update', controller.updateSalaryHistory)
router.post('/create', controller.createLabour)
router.get('/view/:id', controller.viewLabour)
router.get('/view/:mobileNumber', controller.viewLabourByMobileNumber)
router.post('/attendance/update', controller.updateAttendanceHistory)
router.get('/attendance/list/:date', controller.getAttendanceHistoryByDate)
router.get('/salary/list/:month', controller.getSalaryHistoryByMonth)
module.exports = router