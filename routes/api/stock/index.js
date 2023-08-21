const router = require('express').Router()
const controller = require('./stock.controller')

router.post('/list', controller.list)
router.post('/update/:id', controller.updateStock)
router.post('/completeWork', controller.completeWork)
router.post('/updateAll', controller.updateQuanityType)
router.post('/updateQuantity', controller.updateCurrentQuantity)
router.get('/delete/:id', controller.deleteStock)
router.post('/create', controller.createStock)
router.get('/view/:id', controller.viewStock)
module.exports = router