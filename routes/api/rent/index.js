const router = require('express').Router()
const controller = require('./rent.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteRent)
router.post('/create', controller.createRent)
router.post('/update/:id', controller.updateRent)
router.get('/view/:id', controller.viewRent)

module.exports = router