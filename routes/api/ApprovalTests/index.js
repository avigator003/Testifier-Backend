const router = require('express').Router()
const controller = require('./testapproval.controller')


router.post("/saveapproval", controller.saveApproval)
router.get("/deleteapproval/:id", controller.deleteApproval)
router.get("/showall", controller.showAll)
router.get("/view/:id", controller.viewApproval)


module.exports = router