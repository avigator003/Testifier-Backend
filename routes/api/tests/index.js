const router = require('express').Router()
const controller = require('./tests.controller')


router.post("/savetest", controller.saveTest)
router.get("/deletelist/:id", controller.deleteList)
router.get("/showall", controller.showAll)
router.post("/edit/:id", controller.editPlan)

module.exports = router