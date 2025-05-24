import React, { useEffect, useState } from 'react'
import './EmployeeDashboard.scss'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../search/SearchInput'
import toast, { Toaster } from 'react-hot-toast'

const EmployeeDashboard = () => {
  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
        const res = await axios.get(`${apiUrl}/server/users/employees`, {
          withCredentials: true,
        })
        const emps = res.data.filter((emp) => emp.role === 'employee')
        setEmployees(emps)
        setFiltered(emps)
      } catch (err) {
        if (err.response && err.response.status === 401) {
          navigate('/login')
        } else {
          setEmployees([])
          setFiltered([])
        }
      }
    }
    fetchEmployees()
  }, [navigate])

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(employees)
    } else {
      setFiltered(
        employees.filter(
          (emp) =>
            emp.name.toLowerCase().includes(search.toLowerCase()) ||
            emp.email.toLowerCase().includes(search.toLowerCase()) ||
            (emp.department &&
              emp.department.toLowerCase().includes(search.toLowerCase())),
        ),
      )
    }
  }, [search, employees])

  return (
    <div className="employee-dashboard">
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      <h2>Employee List</h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
        }}
      >
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or department..."
        />
      </div>
      <div className="employee-list">
        {filtered && filtered.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={emp._id}>
                  <td>{idx + 1}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No employees found.</div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDashboard
