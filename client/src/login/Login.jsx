import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'
import './login.scss'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleForgotPassword = async () => {
    if (!form.email || !validateEmail(form.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      await toast.promise(
        axios.post(`${apiUrl}/server/users/forgot-password`, {
          email: form.email,
        }),
        {
          loading: 'Sending reset link...',
          success: 'A reset link has been sent.',
          error: 'Failed to send reset link',
        },
      )
    } catch {
      // error handled by toast.promise
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim()) return toast.error('Email is required')
    if (!validateEmail(form.email))
      return toast.error('Please enter a valid email address')
    if (!form.password.trim()) return toast.error('Password is required')
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      const res = await axios.post(
        `${apiUrl}/server/users/login`,
        {
          email: form.email,
          password: form.password,
        },
        { withCredentials: true },
      )
      toast.success(res.data.message || 'Login successful!')
      if (res.data.role === 'manager') {
        navigate('/manager-dashboard')
      } else if (res.data.role === 'employee') {
        navigate('/employee-dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Login failed. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <Toaster
        position="top-right"
        toastOptions={{ duration: 2500 }}
        reverseOrder={true}
      />
      <div className="login__container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <button
            type="button"
            className="forgot-btn"
            onClick={handleForgotPassword}
            disabled={loading}
            aria-label="Forgot Password"
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3em',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4f8cff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12a10 10 0 1 1-4.93-8.36" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Forgot Password?
            </span>
          </button>
          <button type="submit" disabled={loading} aria-label="Login">
            {loading ? (
              <>
                <span className="spinner"></span> Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
          <div className="register-prompt">
            Don't have an account?{' '}
            <button
              type="button"
              className="register-link"
              onClick={() => navigate('/register')}
              aria-label="Go to register page"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
