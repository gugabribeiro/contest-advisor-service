const { StatusCodes } = require('http-status-codes')

const { validate, wrong } = require('../utils')

const Connector = require('../models/Connector')
const Contest = require('../models/Contest')

const Contests = {
  create: async (req, res) => {
    const {
      name,
      penalty,
      connector,
      startTimeInSeconds,
      durationInSeconds,
      contestants,
      problems,
    } = req.body
    const validation = validate(
      [
        'name',
        'penalty',
        'connector',
        'startTimeInSeconds',
        'durationInSeconds',
        'contestants',
        'problems',
      ],
      {
        name,
        penalty,
        connector,
        startTimeInSeconds,
        durationInSeconds,
        contestants,
        problems,
      }
    )
    if (!validation.value) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Missing required fields: [${validation.missing.join(',')}]`,
      })
    }
    try {
      const connectorExists = await Connector.findByPk(connector)
      if (!connectorExists) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${connector}' doesn't exists`,
        })
      }
      const contest = await Contest.create({
        name,
        penalty,
        connector,
        startTimeInSeconds,
        durationInSeconds,
        contestants,
        problems,
      })
      return res.status(StatusCodes.CREATED).send(contest)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  get: async (req, res) => {
    const { id } = req.params
    try {
      const contest = await Contest.findByPk(id)
      if (!contest) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Contest '${id}' doesn't exists`,
        })
      }
      return res.status(StatusCodes.OK).send(contest)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  getAll: async (_, res) => {
    try {
      const contests = await Contest.findAll()
      return res.status(StatusCodes.OK).send(contests)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  update: async (req, res) => {
    const { id } = req.params
    console.log(id)
    const {
      name,
      penalty,
      contestants,
      problems,
      connector,
      startTimeInSeconds,
      durationTimeInSeconds,
    } = req.body
    try {
      if (connector) {
        const connectorExists = await Connector.findByPk(connector)
        if (!connectorExists) {
          return res.status(StatusCodes.NOT_FOUND).send({
            message: `Connector '${connector}' doesn't exists`,
          })
        }
      }
      const [count] = await Contest.update(
        {
          name,
          penalty,
          contestants,
          problems,
          connector,
          startTimeInSeconds,
          durationTimeInSeconds,
        },
        {
          where: {
            id,
          },
        }
      )
      if (!count) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Contest '${id}' doesn't exists`,
        })
      }
      const contest = await Contest.findByPk(id)
      return res.status(StatusCodes.OK).send(contest)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
}

module.exports = Contests
