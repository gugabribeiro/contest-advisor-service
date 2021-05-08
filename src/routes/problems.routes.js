const { Router } = require('express')

const Problems = require('../controllers/problems')

const routes = Router()

routes.get('/problems', Problems.getAll)
routes.post('/problems', Problems.create)
routes.get('/problems/:id', Problems.get)
routes.put('/problems/:id', Problems.update)

module.exports = routes
