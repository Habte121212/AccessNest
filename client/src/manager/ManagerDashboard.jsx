import React, { useEffect, useState } from 'react'
import './ManagerDashboard.scss'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'
import SearchInput from '../search/SearchInput'

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
  })
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    department: '',
    password: '',
  })
  const [showAdd, setShowAdd] = useState(false)
  const [addError, setAddError] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      const res = await axios.get(`${apiUrl}/server/users/employees`, {
        withCredentials: true,
      })
      setEmployees(res.data.filter((emp) => emp.role === 'employee'))
    } catch (err) {
      toast.error('Failed to load employees')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (emp) => {
    setEditingId(emp._id)
    setEditForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
    })
  }

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value })
  }

  const handleUpdate = async (id) => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      await axios.put(`${apiUrl}/server/users/employees/${id}`, editForm, {
        withCredentials: true,
      })
      toast.success('Employee updated')
      setEditingId(null)
      fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    toast(
      (t) => (
        <span>
          Are you sure you want to delete this employee?
          <button
            style={{
              marginLeft: 12,
              color: '#e53935',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={async () => {
              toast.dismiss(t.id)
              setLoading(true)
              try {
                const apiUrl =
                  import.meta.env.VITE_API_URL || 'http://localhost:8500'
                await axios.delete(`${apiUrl}/server/users/employees/${id}`, {
                  withCredentials: true,
                })
                toast.success('Employee deleted')
                fetchEmployees()
              } catch (err) {
                toast.error(err.response?.data?.message || 'Delete failed')
              } finally {
                setLoading(false)
              }
            }}
          >
            Yes, Delete
          </button>
          <button
            style={{
              marginLeft: 8,
              color: '#4f8cff',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
        </span>
      ),
      { duration: 8000 },
    )
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddError('')
    if (
      !addForm.name.trim() ||
      !addForm.email.trim() ||
      !addForm.department.trim() ||
      !addForm.password.trim()
    ) {
      setAddError('All fields are required.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addForm.email)) {
      setAddError('Invalid email format.')
      return
    }
    if (addForm.password.length < 6) {
      setAddError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8500'
      await axios.post(`${apiUrl}/server/users/employees`, addForm, {
        withCredentials: true,
      })
      toast.success('Employee added')
      setAddForm({ name: '', email: '', department: '', password: '' })
      setShowAdd(false)
      fetchEmployees()
    } catch (err) {
      setAddError(err.response?.data?.message || 'Add failed')
      toast.error(err.response?.data?.message || 'Add failed')
    } finally {
      setLoading(false)
    }
  }

  // Filter employees by search
  const filtered = !search.trim()
    ? employees
    : employees.filter(
        (emp) =>
          emp.name.toLowerCase().includes(search.toLowerCase()) ||
          emp.email.toLowerCase().includes(search.toLowerCase()) ||
          (emp.department &&
            emp.department.toLowerCase().includes(search.toLowerCase())),
      )

  return (
    <div className="manager-dashboard">
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2>Manage Employees</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          style={{
            background: '#4f8cff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(79,140,255,0.08)',
            transition: 'background 0.2s',
          }}
        >
          {showAdd ? 'Cancel' : 'Add Employee'}
        </button>
      </div>
      {showAdd && (
        <form
          className="add-form"
          onSubmit={handleAdd}
          autoComplete="off"
          style={{ marginBottom: 32, width: '100%', maxWidth: 700 }}
        >
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <input
              name="name"
              value={addForm.name}
              onChange={handleAddChange}
              placeholder="Name"
              required
              style={{ flex: 1 }}
            />
            <input
              name="email"
              value={addForm.email}
              onChange={handleAddChange}
              placeholder="Email"
              required
              type="email"
              style={{ flex: 1 }}
            />
            <input
              name="department"
              value={addForm.department}
              onChange={handleAddChange}
              placeholder="Department"
              required
              style={{ flex: 1 }}
            />
            <input
              name="password"
              value={addForm.password}
              onChange={handleAddChange}
              placeholder="Password"
              required
              type="password"
              style={{ flex: 1 }}
            />
          </div>
          {addError && (
            <div
              style={{
                color: '#e53935',
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              {addError}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ minWidth: 120, marginTop: 14 }}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}
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
        {loading ? (
          <div className="empty">Loading...</div>
        ) : filtered.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, idx) => (
                <tr key={emp._id}>
                  <td>{idx + 1}</td>
                  <td>
                    {editingId === emp._id ? (
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        required
                      />
                    ) : (
                      emp.name
                    )}
                  </td>
                  <td>
                    {editingId === emp._id ? (
                      <input
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        required
                        type="email"
                      />
                    ) : (
                      emp.email
                    )}
                  </td>
                  <td>
                    {editingId === emp._id ? (
                      <input
                        name="department"
                        value={editForm.department}
                        onChange={handleEditChange}
                        required
                      />
                    ) : (
                      emp.department
                    )}
                  </td>
                  <td>
                    {editingId === emp._id ? (
                      <>
                        <button
                          className="save-btn"
                          onClick={() => handleUpdate(emp._id)}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setEditingId(null)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(emp)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(emp._id)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
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

export default ManagerDashboard
