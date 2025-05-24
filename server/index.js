// loading environments
const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const connectDB = require('./db/dbConfig')
const { registerRoutes, loginRoutes } = require('./router/User')
const cors = require('cors')
const cookieParser = require('cookie-parser')

// intialization
const app = express()
app.use(
  cors({
    origin: 'https://access-nest-git-main-habte121212s-projects.vercel.app', // deployed frontend URL
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookieParser())

// connect to MongoDB
connectDB()

// routes
app.use('/server/users', registerRoutes)
app.use('/server/users', loginRoutes)

// port

const port = process.env.PORT
app.listen(port, () => {
  console.log(`server is running on port ${port}`)
})
