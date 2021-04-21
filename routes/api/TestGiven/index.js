const router = require('express').Router()
const controller = require('./testgiven.controller')


router.post("/savetest", controller.saveTest)
router.get("/deletelist/:id", controller.deleteList)
router.get("/showall", controller.showAll)
router.post("/edit/:id", controller.editTest)
router.get("/view/:id", controller.viewTest)
router.get("/show/:id",controller.showUserTest)

module.exports = router