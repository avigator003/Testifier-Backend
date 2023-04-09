const router = require('express').Router()
const authMiddleware = require('../../middlewares/auth')
const auth = require('./auth')
const user = require('./user')
const admin = require('./admin')
const labour = require('./labour')
const stock = require('./stock')
const rawMaterial = require('./raw-material')
const product = require('./product')
const category = require('./category')
const order = require('./order')


router.use('/auth', auth)
router.use('/user', user)
router.use('/admin', admin)
router.use('/labour', labour)
router.use('/stock', stock)
router.use('/product', product)
router.use('/category', category)
router.use('/order', order)
router.use('/raw-material', rawMaterial)


module.exports = router