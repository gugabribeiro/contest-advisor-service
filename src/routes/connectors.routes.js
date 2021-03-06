const { Router } = require('express')

const Connectors = require('../controllers/connectors')

const routes = Router()

routes.get('/connectors', Connectors.getAll)
routes.post('/connectors', Connectors.create)
routes.get('/connectors/:name', Connectors.get)
routes.put('/connectors/:name', Connectors.update)
// routes.get('/connectors/:name/problems', Connectors.problems)
routes.post(
  '/connectors/:name/recommendedProblems',
  Connectors.recommendedProblems
)

module.exports = routes
