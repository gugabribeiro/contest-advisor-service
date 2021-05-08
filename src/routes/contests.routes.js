const { Router } = require('express')

const Contests = require('../controllers/contests')

const routes = Router()

routes.get('/contests', Contests.getAll)
routes.post('/contests', Contests.create)
routes.get('/contests/:id', Contests.get)
routes.put('/contests/:id', Contests.update)
routes.get('/contests/:id/status', Contests.status)

module.exports = routes
