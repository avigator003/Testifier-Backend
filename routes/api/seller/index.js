const router = require('express').Router()
const controller = require('./seller.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteSeller)
router.post('/create', controller.createSeller)
router.post('/update/:id', controller.updateSeller)
router.get('/view/:id', controller.viewSeller)

module.exports = router