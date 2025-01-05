const router = require('express').Router()
const controller = require('./rawmaterialbill.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteRawMaterialBill)
router.post('/create', controller.createRawMaterialBill)
router.post('/update/:id', controller.updateRawMaterialBill)
router.get('/view/:id', controller.viewRawMaterialBil)

module.exports = router