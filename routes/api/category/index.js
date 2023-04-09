const router = require('express').Router()
const controller = require('./category.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteCategory)
router.post('/update/:id', controller.updateCategory)
router.post('/create', controller.createCategory)
router.get('/view/:id', controller.viewCategory)


module.exports = router