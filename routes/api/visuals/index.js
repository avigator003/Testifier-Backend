const router = require('express').Router()
const controller = require('./visuals.controller')

router.post('/day', controller.graphsDay)
router.post('/month', controller.graphsMonth)
router.post('/year', controller.graphsYear)
module.exports = router