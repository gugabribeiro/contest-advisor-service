const { Op } = require('sequelize')
const { StatusCodes } = require('http-status-codes')

const { validate, wrong } = require('../utils')
const Connector = require('../models/Connector')
const Problem = require('../models/Problem')

const Problems = {
  create: async (req, res) => {
    const { id, name, url, connector, level, topics } = req.body
    const validation = validate(
      ['id', 'name', 'url', 'connector', 'level', 'topics'],
      {
        id,
        name,
        url,
        connector,
        level,
        topics,
      }
    )
    if (!validation.value) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Missing required fields: [${validation.missing.join(',')}]`,
      })
    }
    try {
      const exists = await Connector.findByPk(connector)
      if (!exists) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Problem '${connector}' doesn't exists`,
        })
      }
      const [problem, created] = await Problem.findOrCreate({
        where: {
          id,
        },
        defaults: {
          id,
          name,
          url,
          connector,
          level,
          topics,
        },
      })
      if (!created) {
        return res
          .status(StatusCodes.CONFLICT)
          .send({ message: `Problem '${id}' already exists` })
      }
      return res.status(StatusCodes.CREATED).send(problem)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  get: async (req, res) => {
    const { id } = req.params
    try {
      const problem = await Connector.findByPk(id)
      if (!problem) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${id}' doesn't exists`,
        })
      }
      return res.status(StatusCodes.OK).send(problem)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  getAll: async (req, res) => {
    const { connector } = req.query
    try {
      const problems = await Problem.findAll(
        connector
          ? {
              where: {
                connector,
              },
            }
          : {}
      )
      return res.status(StatusCodes.OK).send(problems)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  update: async (req, res) => {
    const { id } = req.params
    const { name, url, connector, level, topics } = req.body
    try {
      if (connector) {
        const exists = await Connector.findByPk(connector)
        if (!exists) {
          return res.status(StatusCodes.NOT_FOUND).send({
            message: `Connector '${connector}' doesn't exists`,
          })
        }
      }
      const [count] = await Problem.update(
        {
          name,
          url,
          connector,
          level,
          topics,
        },
        {
          where: {
            id,
          },
        }
      )
      if (!count) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Problem '${id}' doesn't exists`,
        })
      }
      const problem = await Problem.findByPk(id)
      return res.status(StatusCodes.OK).send(problem)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
}

module.exports = Problems
