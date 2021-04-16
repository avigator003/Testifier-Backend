const router = require('express').Router()
const authMiddleware = require('../../middlewares/auth')
const auth = require('./auth')
const user = require('./user')
const admin = require('./admin')
const tests = require('./tests')
const testGiven = require('./TestGiven')

router.use('/auth', auth)

router.use('/user', user)
/*
router.use('/tasks', tasks)
router.use("/calendar", calendar)
router.use("/activity", activity)
*/
router.use('/admin', admin)

router.use('/tests', tests)

router.use('/testgiven', testGiven)
/*
router.use('/document', document)
router.use('/account', account)
router.use('/ticket', support)
router.use('/communication', Communication)
router.use('/notes', Notes)
router.use('/subscription', Subscription)
router.use("/footer", Footer)
router.use('/aboutus/', aboutus)
*/

module.exports = router