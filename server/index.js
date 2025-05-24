// loading environments
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const connectDB = require('./db/dbConfig')
const { registerRoutes, loginRoutes } = require('./router/User')


// intialization
const app = express();
app.use(express.json());

// connect to MongoDB
connectDB();

// routes
app.use('/server/users', registerRoutes)
app.use('/server/users', loginRoutes)


// port

const port = process.env.PORT
app.listen(port, () => {
  console.log(`server is running on port ${port}`)
});