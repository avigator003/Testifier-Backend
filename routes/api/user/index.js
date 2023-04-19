const router = require('express').Router()
const controller = require('./user.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteUser)
router.post('/update/:id', controller.updateUser)
router.post('/create', controller.createUser)
router.get('/view/:id', controller.viewUser)
router.post('/login/:mobileNumber', controller.loginByMobileNumber)
router.post('/login', controller.loginByMobileNumberAndPassword)
router.get('/view/:mobileNumber', controller.viewUserByMobileNumber)
module.exports = router