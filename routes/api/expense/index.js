const router = require('express').Router()
const controller = require('./expense.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deleteExpense)
router.post('/create', controller.createExpense)
router.post('/update/:id', controller.updateExpense)
router.get('/view/:id', controller.viewExpense)

module.exports = router