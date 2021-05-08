require('dotenv').config()

const express = require('express')
const database = require('./database')

const server = express()
const port = process.env.PORT

server.use(express.json())

server.get('/', (_, res) => {
  res.send({ message: 'Running' })
})

database
  .authenticate()
  .then(() => {
    console.log('Successfully connected to the database')
    server.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  })
  .catch((err) => {
    console.error(err)
  })
