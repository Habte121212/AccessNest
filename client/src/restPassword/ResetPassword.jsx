import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import './resetPassword.scss'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Frontend validation
    if (!form.password.trim()) {
      toast.error('Password is required')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (!form.confirm.trim()) {
      toast.error('Please confirm your password.')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await axios.post(
        `http://localhost:8500/server/users/reset-password/${token}`,
        {
          password: form.password,
        },
      )
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      // Improved error handling
      if (err.response?.data?.message) {
        toast.error(err.response.data.message)
      } else if (err.request) {
        toast.error('No response from server. Please try again later.')
      } else {
        toast.error('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password">
      <Toaster position="top-right" />
      <div className="reset-password__container">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              name="password"
              placeholder="New password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirm">Confirm Password</label>
            <input
              type="password"
              name="confirm"
              placeholder="Confirm password"
              value={form.confirm}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
