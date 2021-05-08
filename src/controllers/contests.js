const { StatusCodes } = require('http-status-codes')

const { validate, wrong } = require('../utils')

const Contest = require('../models/Contest')
const Connector = require('../models/Connector')
const ConnectorClient = require('../clients/ConnectorClient')

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
      durationInSeconds,
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
          durationInSeconds,
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
  status: async (req, res) => {
    const { id } = req.params
    try {
      const contest = await Contest.findByPk(id)
      if (!contest) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Contest '${id}' doesn't exists`,
        })
      }
      const {
        startTimeInSeconds,
        durationInSeconds,
        connector: connectorName,
        contestants: users,
        problems,
      } = contest
      const connector = await Connector.findByPk(connectorName)
      if (!connector) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${connectorName}' doesn't exists`,
        })
      }
      const client = new ConnectorClient(connector.toJSON())
      var status = {}
      for (const user of users) {
        var userStatus = {}
        for (const problem of problems) {
          userStatus = {
            ...userStatus,
            [problem]: {
              tries: 0,
              solved: false,
              solvedTimeInSeconds: Number.MAX_SAFE_INTEGER,
            },
          }
        }
        const submissions = await client.submissions(user)
        for (const submission of submissions) {
          const { problemId, status, momentInSeconds } = submission
          if (!(problemId in userStatus)) {
            continue
          }
          if (
            momentInSeconds > durationInSeconds ||
            momentInSeconds < startTimeInSeconds
          ) {
            continue
          }
          if (status === 'SOLVED') {
            userStatus[problemId].solved = true
            userStatus[problemId].solvedTimeInSeconds = Math.min(
              momentInSeconds,
              userStatus[problemId].solvedTimeInSeconds
            )
          }
          userStatus[problemId].tries++
        }
        status = {
          ...status,
          [user]: userStatus,
        }
      }
      res.status(StatusCodes.OK).send(status)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
}

module.exports = Contests
