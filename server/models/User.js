const mongoose = require('mongoose')
const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['employee', 'manager'],
      default: 'employee',
    },
    department: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', schema)
