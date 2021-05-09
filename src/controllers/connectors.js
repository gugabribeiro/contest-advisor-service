const { StatusCodes } = require('http-status-codes')

const { validate, wrong } = require('../utils')
const Connector = require('../models/Connector')
const ConnectorClient = require('../clients/ConnectorClient')

const Connectors = {
  create: async (req, res) => {
    const { name, url } = req.body
    const validation = validate(['name', 'url'], {
      name,
      url,
    })
    if (!validation.value) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Missing required fields: [${validation.missing.join(',')}]`,
      })
    }
    try {
      const [connector, created] = await Connector.findOrCreate({
        where: {
          name,
        },
        defaults: {
          name,
          url,
        },
      })
      if (!created) {
        return res
          .status(StatusCodes.CONFLICT)
          .send({ message: `Connector '${name}' already exists` })
      }
      return res.status(StatusCodes.CREATED).send(connector)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  get: async (req, res) => {
    const { name } = req.params
    try {
      const connector = await Connector.findByPk(name)
      if (!connector) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${name}' doesn't exists`,
        })
      }
      return res.status(StatusCodes.OK).send(connector)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  getAll: async (_, res) => {
    try {
      const connectors = await Connector.findAll()
      return res.status(StatusCodes.OK).send(connectors)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  update: async (req, res) => {
    const { name } = req.params
    const { url } = req.body
    try {
      const [count] = await Connector.update(
        {
          url,
        },
        {
          where: {
            name,
          },
        }
      )
      if (!count) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${name}' doesn't exists`,
        })
      }
      const connector = await Connector.findByPk(name)
      return res.status(StatusCodes.OK).send(connector)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  problems: async (req, res) => {
    const { name } = req.params
    try {
      const connector = await Connector.findByPk(name)
      if (!connector) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${name}' doesn't exists`,
        })
      }
      const client = new ConnectorClient(connector.toJSON())
      const problems = await client.problems()
      return res.status(StatusCodes.NOT_FOUND).send(problems)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  redirect: async (req, res) => {
    const { name, problemId } = req.params
    try {
      const connector = await Connector.findByPk(name)
      if (!connector) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${name}' doesn't exists`,
        })
      }
      const client = new ConnectorClient(connector.toJSON())
      const url = await client.redirect(problemId)
      res.status(StatusCodes.MOVED_TEMPORARILY).redirect(url)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
}

module.exports = Connectors
