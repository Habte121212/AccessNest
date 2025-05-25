import React, { useState } from 'react'
import './register.scss'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Register = () => {
  const [role, setRole] = useState('employee')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    adminCode: '',
  })
  const [loading, setLoading] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRoleChange = (e) => {
    setRole(e.target.value)
  }

  const validate = () => {
    if (!form.name.trim()) return toast.error('Name is required')
    if (form.name.trim().length < 3)
      return toast.error('Name must be at least 3 characters.')
    if (!form.email.trim()) return toast.error('Email is required')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      return toast.error('Invalid email format')
    if (!form.password.trim()) return toast.error('Password is required')
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters.')
    if (!confirmPassword.trim())
      return toast.error('Please confirm your password.')
    if (form.password !== confirmPassword)
      return toast.error('Passwords do not match.')
    if (role === 'employee' && !form.department.trim())
      return toast.error('Department is required for employees.')
    if (role === 'manager' && !form.adminCode.trim())
      return toast.error('Admin code is required for managers.')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      // Always use only the deployed API URL in production
      const apiUrl = import.meta.env.VITE_API_URL
      const res = await axios.post(`${apiUrl}/server/users/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
        department: role === 'employee' ? form.department : '',
        adminCode: role === 'manager' ? form.adminCode : '',
        role,
      })
      toast.success(
        res.data.message || 'Registration successful! Please login.',
      )
      setTimeout(() => {
        setLoading(false)
        navigate('/login')
      }, 1200)
    } catch (err) {
      setLoading(false)
      toast.error(
        err.response?.data?.message || 'Registration failed. Please try again.',
      )
    }
  }

  return (
    <div className="register">
      <Toaster
        position="top-right"
        toastOptions={{ duration: 2500 }}
        reverseOrder={true}
      />
      {loading && (
        <div className="register__loading-overlay">
          <div className="register__spinner"></div>
        </div>
      )}
      <div className={`register__container${loading ? ' dimmed' : ''}`}>
        <h2>Register</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="role-select">
            <label>
              <input
                type="radio"
                name="role"
                value="employee"
                checked={role === 'employee'}
                onChange={handleRoleChange}
                disabled={loading}
                required
                aria-label="Employee role"
              />
              Employee
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="manager"
                checked={role === 'manager'}
                onChange={handleRoleChange}
                disabled={loading}
                required
                aria-label="Manager role"
              />
              Manager
            </label>
          </div>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
            autoComplete="off"
            required
            placeholder="Name"
            aria-label="Name"
            style={{ marginBottom: '0.7rem' }}
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            autoComplete="off"
            required
            placeholder="Email"
            aria-label="Email"
            style={{ marginBottom: '0.7rem' }}
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            autoComplete="new-password"
            required
            placeholder="Password"
            aria-label="Password"
            style={{ marginBottom: '0.7rem' }}
          />
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            autoComplete="new-password"
            required
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            style={{ marginBottom: '0.7rem' }}
          />
          {role === 'employee' && (
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              disabled={loading}
              autoComplete="off"
              required
              placeholder="Department"
              aria-label="Department"
              style={{ marginBottom: '0.7rem' }}
            />
          )}
          {role === 'manager' && (
            <input
              type="text"
              name="adminCode"
              value={form.adminCode}
              onChange={handleChange}
              disabled={loading}
              autoComplete="off"
              required
              placeholder="Admin Code"
              aria-label="Admin Code"
              style={{ marginBottom: '0.7rem' }}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="register-btn"
            aria-label="Register"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          <button
            type="button"
            className="login-btn"
            onClick={() => navigate('/login')}
            disabled={loading}
            aria-label="Go to login page"
          >
            Already have an account? Log in
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
