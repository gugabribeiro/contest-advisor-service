const sequelize = require('sequelize')
const { StatusCodes } = require('http-status-codes')

const { validate, wrong, validUUID } = require('../utils')

const cache = require('../cache')
const Contest = require('../models/Contest')
const Connector = require('../models/Connector')
const ConnectorClient = require('../clients/ConnectorClient')

const Contests = {
  create: async (req, res) => {
    const {
      name,
      penalty,
      connector,
      redirectUrl,
      startTimeInSeconds,
      durationInSeconds,
      contestants,
      problems,
    } = req.body
    const { email } = res.locals
    const validation = validate(
      [
        'name',
        'penalty',
        'connector',
        'redirectUrl',
        'startTimeInSeconds',
        'durationInSeconds',
        'contestants',
        'problems',
      ],
      {
        name,
        penalty,
        connector,
        redirectUrl,
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
        redirectUrl,
        startTimeInSeconds,
        durationInSeconds,
        contestants,
        problems,
        owner: email,
      })
      return res.status(StatusCodes.CREATED).send(contest)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  get: async (req, res) => {
    const { id } = req.params
    if (!validUUID(id)) {
      return res.status(StatusCodes.NOT_FOUND).send({
        message: `Contest '${id}' doesn't exists`,
      })
    }
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
    const { email } = res.locals
    try {
      const contests = await Contest.findAll({
        where: {
          owner: email,
        },
        order: sequelize.literal('"updatedAt" DESC'),
      })
      return res.status(StatusCodes.OK).send(contests)
    } catch (err) {
      console.log(err)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  update: async (req, res) => {
    const { id } = req.params
    const {
      name,
      penalty,
      contestants,
      problems,
      connector,
      redirectUrl,
      startTimeInSeconds,
      durationInSeconds,
    } = req.body
    const { email } = res.locals
    try {
      if (connector) {
        const connectorExists = await Connector.findByPk(connector)
        if (!connectorExists) {
          return res.status(StatusCodes.NOT_FOUND).send({
            message: `Connector '${connector}' doesn't exists`,
          })
        }
      }
      const contest = await Contest.findByPk(id)
      if (!contest) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Contest '${id}' doesn't exists`,
        })
      }
      const { owner } = contest
      if (owner !== email) {
        return res.status(StatusCodes.FORBIDDEN).send({
          message: 'You are not allowed to do that',
        })
      }
      await Contest.update(
        {
          name,
          penalty,
          contestants,
          problems,
          redirectUrl,
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
      const response = await Contest.findByPk(id)
      cache.expire(id)
      return res.status(StatusCodes.OK).send(response)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
  status: async (req, res) => {
    const { id } = req.params
    try {
      const cached = await cache.get(id)
      if (cached) {
        return res.status(StatusCodes.OK).send(cached)
      }
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
            momentInSeconds > startTimeInSeconds + durationInSeconds ||
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
        }
        for (const submission of submissions) {
          const { problemId, momentInSeconds } = submission
          if (!(problemId in userStatus)) {
            continue
          }
          if (
            momentInSeconds > startTimeInSeconds + durationInSeconds ||
            momentInSeconds < startTimeInSeconds
          ) {
            continue
          }
          if (userStatus[problemId].solved) {
            if (momentInSeconds <= userStatus[problemId].solvedTimeInSeconds) {
              userStatus[problemId].tries++
            }
          } else {
            userStatus[problemId].tries++
          }
        }
        status = {
          ...status,
          [user]: userStatus,
        }
      }
      cache.set(id, status, 60)
      res.status(StatusCodes.OK).send(status)
    } catch (err) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
}

module.exports = Contests
