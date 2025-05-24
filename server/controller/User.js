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
    })

    // Set token as HTTP-only cookie and send response once
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'none',
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

module.exports = { registerUser, loginUser, forgotPassword, resetPassword }
