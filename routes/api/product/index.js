const router = require('express').Router()
const controller = require('./product.controller')

router.post('/update/:id', controller.updateProduct)
router.get('/list', controller.showAll)
router.get('/delete/:id', controller.deleteProduct)
router.post('/create', controller.createProduct)
router.get('/view/:id', controller.viewProduct)

module.exports = router
