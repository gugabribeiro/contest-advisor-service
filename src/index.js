require('dotenv').config()

const express = require('express')
const database = require('./database')

const server = express()
const port = process.env.PORT

server.use(express.json())

server.get('/', (_, res) => {
  res.send({ message: 'Running' })
})

const connectors = require('./routes/connectors.routes')
server.use('/api', connectors)

const contests = require('./routes/contests.routes')
server.use('/api', contests)

database
  .authenticate()
  .then(async () => {
    console.log('\x1b[32m%s\x1b[0m', 'Successfully connected to the database')
    try {
      console.log('\x1b[32m%s\x1b[0m', 'Syncing database models...')
      await database.sync({
        force: false,
      })
      console.log('\x1b[32m%s\x1b[0m', 'Database synchronized successfully')
      server.listen(port, () => {
        console.log(
          '\x1b[36m%s\x1b[0m',
          `Server running on  http://localhost:${port}`
        )
      })
    } catch (err) {
      console.error(err)
    }
  })
  .catch((err) => {
    console.error(err)
  })
