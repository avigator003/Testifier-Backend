const router = require('express').Router()
const controller = require('./vehicle.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteVehicle)
router.post('/create', controller.createVehicle)
router.post('/update/:id', controller.updateVehicle)
router.get('/view/:id', controller.viewVehicle)

module.exports = router