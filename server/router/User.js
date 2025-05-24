const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require('../controller/User')

// REGISTER
router.post('/register', async (req, res, next) => {
  const { role, adminCode } = req.body
  if (role === 'manager') {
    // In production, use process.env.ADMIN_CODE and keep it secret
    const correctCode = process.env.ADMIN_CODE
    if (!adminCode || adminCode !== correctCode) {
      return res.status(403).json({ message: 'Invalid admin code.' })
    }
  }
  // Pass to controller
  return registerUser(req, res, next)
})
//LOGIN
router.post('/login', loginUser)

//forgot password
router.post('/forgot-password', forgotPassword)

//reset password
router.post('/reset-password/:token', resetPassword)

const registerRoutes = router
const loginRoutes = loginUser

module.exports = { registerRoutes, loginRoutes, forgotPassword, resetPassword }
