const { Router } = require('express')

const Connectors = require('../controllers/connectors')

const routes = Router()

routes.get('/connectors', Connectors.getAll)
routes.post('/connectors', Connectors.create)
routes.get('/connectors/:name', Connectors.get)
routes.put('/connectors/:name', Connectors.update)
routes.get(
  '/connectors/:name/problems/:problemId/redirect',
  Connectors.redirect
)

module.exports = routes
