const { Router } = require('express')

const { authenticated } = require('../auth')
const Contests = require('../controllers/contests')

const routes = Router()

routes.get('/contests', [authenticated, Contests.getAll])
routes.post('/contests', [authenticated, Contests.create])
routes.get('/contests/:id', Contests.get)
routes.put('/contests/:id', [authenticated, Contests.update])
routes.get('/contests/:id/status', Contests.status)

module.exports = routes
