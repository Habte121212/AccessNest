import './App.css'
import EmployeeDashboard from './employee/EmployeeDashboard'
import ManagerDashboard from './manager/ManagerDashboard'
import Register from './register/Register'
import Login from './login/Login'
import ResetPassword from './restPassword/ResetPassword'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { Routes, Route, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function App() {
  const [user, setUser] = useState(null)
  const [employees, setEmployees] = useState([])
  const navigate = useNavigate()

  // Session persistence: check for valid session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
        const res = await axios.get(`${apiUrl}/server/users/me`, {
          withCredentials: true,
        })
        if (res.data && res.data.role) {
          setUser({ role: res.data.role })
          console.log('Session check: user role =', res.data.role)
          if (res.data.role === 'manager') {
            console.log('Navigating to /manager-dashboard')
            navigate('/manager-dashboard')
          } else {
            console.log('Navigating to /employee-dashboard')
            navigate('/employee-dashboard')
          }
        }
      } catch {
        setUser(null)
      }
    }
    checkSession()
    // eslint-disable-next-line
  }, [])

  // Fetch employees (used after login and after add/update/delete)
  const fetchEmployees = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      const res = await axios.get(`${apiUrl}/server/users/employees`, {
        withCredentials: true,
      })
      setEmployees(res.data)
    } catch (err) {
      setEmployees([])
      if (err.response?.status === 401) {
        setUser(null)
        navigate('/login')
      }
    }
  }

  const handleLogin = async (form) => {
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
      setUser({ role: res.data.role })
      console.log('Login: user role =', res.data.role)
      if (res.data.role === 'manager') {
        console.log('Navigating to /manager-dashboard')
        navigate('/manager-dashboard')
      } else {
        console.log('Navigating to /employee-dashboard')
        navigate('/employee-dashboard')
      }
    } catch (err) {
      throw err
    }
  }

  // Manager actions
  const handleAdd = async (form) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      await axios.post(
        `${apiUrl}/server/users/employees`,
        {
          name: form.name,
          email: form.email,
          department: form.department,
          password: form.password || 'default1234', // You may want to prompt for password or auto-generate
        },
        { withCredentials: true },
      )
      toast.success('Employee added')
      await fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Add failed')
    }
  }
  const handleUpdate = async (id, form) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      await axios.put(
        `${apiUrl}/server/users/employees/${id}`,
        {
          name: form.name,
          email: form.email,
          department: form.department,
        },
        { withCredentials: true },
      )
      toast.success('Employee updated')
      await fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }
  const handleDelete = async (id) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      await axios.delete(`${apiUrl}/server/users/employees/${id}`, {
        withCredentials: true,
      })
      toast.success('Employee deleted')
      await fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <>
      {/* Navigation links for demo/testing */}
      {user?.role === 'manager' && (
        <nav style={{ padding: '10px', textAlign: 'right' }}>
          <button
            onClick={() => navigate('/manager-dashboard')}
            style={{ marginRight: 8 }}
          >
            Manager Dashboard
          </button>
          <button onClick={() => navigate('/employee-dashboard')}>
            Employee Dashboard
          </button>
        </nav>
      )}
      {user?.role === 'employee' && (
        <nav style={{ padding: '10px', textAlign: 'right' }}>
          <button onClick={() => navigate('/employee-dashboard')}>
            Employee Dashboard
          </button>
        </nav>
      )}
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route
          path="/manager-dashboard"
          element={
            user?.role === 'manager' ? (
              <ManagerDashboard
                employees={employees}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            user?.role === 'employee' ? (
              <EmployeeDashboard employees={employees} />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    </>
  )
}

export default App
