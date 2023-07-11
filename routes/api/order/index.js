const router = require('express').Router()
const controller = require('./order.controller')

router.get('/list', controller.list)
router.get('/delete/:id', controller.deletOrder)
router.post('/update/:rowId', controller.updateOrder)
router.post('/update_order_status/:id', controller.updateOrderStatus)
router.post('/update_payment_status/:id', controller.updatePaymentStatus)
router.post('/create', controller.createOrder)
router.get('/view/:id', controller.viewOrder)
router.post('/view_by_date_or_user', controller.viewOrderByDateOrUser)
router.get('/download_invoice/:id', controller.donwloadInvoice)

module.exports = router