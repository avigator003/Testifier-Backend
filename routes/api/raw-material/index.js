const router = require('express').Router()
const controller = require('./rawmaterial.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteRawMaterial)
router.post('/update/:id', controller.updateRawMaterial)
router.post('/create', controller.createRawMaterial)
router.get('/view/:id', controller.viewRawMaterial)
router.get('/view-history/:id', controller.viewRawMaterialHistory)
router.post('/buy/:id', controller.buyRawMaterial)
router.post('/use/:id', controller.useRawMaterial)

module.exports = router