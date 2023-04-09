const router = require('express').Router()
const controller = require('./user.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteUser)
router.post('/update/:id', controller.updateUser)
router.post('/create', controller.createUser)
router.get('/view/:id', controller.viewUser)
router.get('/login/:mobileNumber', controller.loginByMobileNumber)
router.get('/view/:mobileNumber', controller.viewUserByMobileNumber)
module.exports = router