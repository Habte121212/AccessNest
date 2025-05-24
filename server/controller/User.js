const user = require('../models/User')
const bcrypt = require('bcrypt')
const Joi = require('joi')
const { generateToken } = require('../utils/jwt')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

//REGISTER USERS
const registerUser = async (req, res) => {
  try {
    // Joi schema for validation
    const schema = Joi.object({
      name: Joi.string().min(3).max(20).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      department: Joi.when('role', {
        is: 'employee',
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow(''),
      }),
      adminCode: Joi.when('role', {
        is: 'manager',
        then: Joi.string().required(),
        otherwise: Joi.string().optional().allow(''),
      }),
      role: Joi.string().valid('employee', 'manager').required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const { name, email, password, department, adminCode, role } = req.body
    // check if user already exists
    const existingUser = await user.findOne({ email })
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' })

    // hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // create new user
    const newUser = new user({
      name,
      email,
      password: hashedPassword,
      department: role === 'employee' ? department : '',
      adminCode: role === 'manager' ? adminCode : '',
      role,
    })

    // Save the user
    await newUser.save()
    res.status(201).json({ message: 'User registered successfully.' })
  } catch (error) {
    console.error('Error registrations:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

//LOGIN USERS
const loginUser = async (req, res) => {
  try {
    //joi schema for validations
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    })

    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }

    const { email, password } = req.body
    // check if user exists
    const existingUser = await user.findOne({ email })
    if (!existingUser) {
      return res.status(400).json({ message: 'User not found' })
    }

    // check password
    const isMatch = await bcrypt.compare(password, existingUser.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' })
    }

    // generate token
    const token = generateToken({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role, // include role in token
    })

    // Set token as HTTP-only cookie and send response once
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // for localhost development
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax', // for localhost development
    })
    return res
      .status(200)
      .json({ message: 'Login successful', role: existingUser.role, token })
  } catch (error) {
    console.error('Error Logging in:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body
  // Use Joi for validation instead of validator
  const schema = Joi.object({
    email: Joi.string().email().required(),
  })
  const { error } = schema.validate({ email })
  if (error) {
    return res
      .status(400)
      .json({ message: 'Please enter a valid email address.' })
  }
  try {
    const foundUser = await user.findOne({ email })
    if (!foundUser) {
      // For security, do not reveal if user exists
      return res.status(200).json({
        message: 'A reset link has been sent.',
      })
    }

    // Generate a reset token and expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')
    foundUser.resetPasswordToken = resetTokenHash
    foundUser.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await foundUser.save()

    // Create reset URL using CLIENT_URL from .env
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // Email options
    const mailOptions = {
      from: `Employee Management <${process.env.EMAIL_USER}>`,
      to: foundUser.email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, please ignore this email.</p>`,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return res.status(200).json({
      message: 'A reset link has been sent.',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error.' })
  }
}

// Reset Password
const resetPassword = async (req, res) => {
  const { token } = req.params
  const { password } = req.body
  if (!password || password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters.' })
  }
  try {
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')
    const foundUser = await user.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!foundUser) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired reset token.' })
    }
    const salt = await bcrypt.genSalt(10)
    foundUser.password = await bcrypt.hash(password, salt)
    foundUser.resetPasswordToken = ''
    foundUser.resetPasswordExpires = undefined
    await foundUser.save()
    return res.status(200).json({ message: 'Password reset successful.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Internal server error.' })
  }
}

// GET EMPLOYEES (for dashboard)
const getEmployees = async (req, res) => {
  try {
    // Get user from request (set by auth middleware)
    const userId = req.user?.id
    const userRole = req.user?.role
    console.log('getEmployees: userId:', userId, 'userRole:', userRole)
    if (!userId || !userRole) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (userRole === 'manager') {
      // Managers see all employees
      const employees = await user.find({}, 'name email department role _id')
      console.log('Employees found:', employees.length)
      return res.status(200).json(employees)
    } else {
      // Employees see only themselves
      const self = await user.findById(userId, 'name email department role _id')
      console.log('Employee self:', self)
      return res.status(200).json(self ? [self] : [])
    }
  } catch (error) {
    console.error('Error fetching employees:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// ADD EMPLOYEE (manager only)
const addEmployee = async (req, res) => {
  try {
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    // Validate input
    const schema = Joi.object({
      name: Joi.string().min(3).max(20).required(),
      email: Joi.string().email().required(),
      department: Joi.string().required(),
      password: Joi.string().min(6).required(),
    })
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }
    const { name, email, department, password } = req.body
    // Check if email exists
    const existing = await user.findOne({ email })
    if (existing)
      return res.status(400).json({ message: 'Email already exists' })
    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    // Create employee
    const newEmp = new user({
      name,
      email,
      department,
      password: hashedPassword,
      role: 'employee',
    })
    await newEmp.save()
    return res.status(201).json({
      message: 'Employee added',
      employee: {
        _id: newEmp._id,
        name,
        email,
        department,
        role: 'employee',
      },
    })
  } catch (error) {
    console.error('Error adding employee:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// UPDATE EMPLOYEE (manager only)
const updateEmployee = async (req, res) => {
  try {
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const { id } = req.params
    const schema = Joi.object({
      name: Joi.string().min(3).max(20),
      email: Joi.string().email(),
      department: Joi.string(),
    })
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ message: error.details[0].message })
    }
    const updated = await user.findByIdAndUpdate(id, req.body, {
      new: true,
      fields: 'name email department role _id',
    })
    if (!updated) return res.status(404).json({ message: 'Employee not found' })
    return res
      .status(200)
      .json({ message: 'Employee updated', employee: updated })
  } catch (error) {
    console.error('Error updating employee:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// DELETE EMPLOYEE (manager only)
const deleteEmployee = async (req, res) => {
  try {
    if (req.user?.role !== 'manager') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    const { id } = req.params
    const deleted = await user.findByIdAndDelete(id)
    if (!deleted) return res.status(404).json({ message: 'Employee not found' })
    return res.status(200).json({ message: 'Employee deleted' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

// GET CURRENT USER (for session persistence)
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Unauthorized' })
    const found = await user.findById(userId, 'name email department role _id')
    if (!found) return res.status(404).json({ message: 'User not found' })
    return res.status(200).json(found)
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getCurrentUser,
}
