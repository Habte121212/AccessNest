const express = require('express')
const router = express.Router()
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getCurrentUser,
} = require('../controller/User')
const { verifyToken } = require('../utils/jwt')

// Simple JWT auth middleware
function authMiddleware(req, res, next) {
  console.log('Cookies:', req.cookies)
  const token =
    req.cookies?.token || req.headers['authorization']?.replace('Bearer ', '')
  if (!token) {
    console.log('No token provided')
    return res.status(401).json({ message: 'No token provided' })
  }
  try {
    const decoded = verifyToken(token)
    req.user = decoded
    console.log('Decoded user:', decoded)
    next()
  } catch (err) {
    console.log('JWT error:', err)
    // Add more detailed error info for debugging
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Token expired', error: err.message })
    } else if (err.name === 'JsonWebTokenError') {
      return res
        .status(400)
        .json({ message: 'Invalid token', error: err.message })
    } else {
      return res.status(400).json({ message: 'JWT error', error: err.message })
    }
  }
}

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

// GET employees (protected)
router.get('/employees', authMiddleware, getEmployees)
// ADD employee (manager only)
router.post('/employees', authMiddleware, addEmployee)
// UPDATE employee (manager only)
router.put('/employees/:id', authMiddleware, updateEmployee)
// DELETE employee (manager only)
router.delete('/employees/:id', authMiddleware, deleteEmployee)
// GET current user (session persistence)
router.get('/me', authMiddleware, getCurrentUser)

const registerRoutes = router
const loginRoutes = loginUser

module.exports = { registerRoutes, loginRoutes, forgotPassword, resetPassword }
