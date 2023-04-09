const router = require('express').Router()
const controller = require('./stock.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteStock)
router.post('/create', controller.createStock)
router.get('/view/:id', controller.viewStock)
module.exports = router