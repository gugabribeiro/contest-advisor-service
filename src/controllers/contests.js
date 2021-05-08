const { StatusCodes } = require('http-status-codes')

const { validate, wrong } = require('../utils')
const Problem = require('../models/Problem')
const Connector = require('../models/Connector')
const Contest = require('../models/Contest')

const Contests = {
  create: async (req, res) => {
    const {
      name,
      connector,
      startTimeInSeconds,
      durationInSeconds,
      users,
      problems,
    } = req.body
    const validation = validate(
      [
        'name',
        'connector',
        'startTimeInSeconds',
        'durationInSeconds',
        'users',
        'problems',
      ],
      {
        name,
        connector,
        startTimeInSeconds,
        durationInSeconds,
        users,
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
      const problemsExists = await Promise.all(
        problems.map((problem) => Problem.findByPk(problem))
      )
      if (problemsExists.includes(null)) {
        const nonExistingsProblems = problemsExists.reduce(
          (previous, problem, index) => {
            if (!problem) {
              return [...previous, problems[index]]
            }
            return previous
          },
          []
        )
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Problems [${nonExistingsProblems.join(
            ', '
          )} doesn't exists]`,
        })
      }
      const contest = await Contest.create({
        name,
        connector,
        startTimeInSeconds,
        durationInSeconds,
        users,
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
      const problemIds = contest.problems
      console.log(problemIds)
      const problems = await Promise.all(
        problemIds.map((problemId) => Problem.findByPk(problemId))
      )
      return res.status(StatusCodes.OK).send({
        ...contest.toJSON(),
        problems: problems.map((problem) => problem.toJSON()),
      })
    } catch (err) {
      console.log(err)
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
    const {
      name,
      users,
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
      if (problems) {
        const problemsExists = await Promise.all(
          problems.map((problem) => Problem.findByPk(problem))
        )
        if (problemsExists.includes(null)) {
          const nonExistingsProblems = problemsExists.reduce(
            (previous, problem, index) => {
              if (!problem) {
                return [...previous, problems[index]]
              }
              return previous
            },
            []
          )
          return res.status(StatusCodes.NOT_FOUND).send({
            message: `Problems [${nonExistingsProblems.join(
              ', '
            )}] doesn't exists`,
          })
        }
      }
      const [count] = await Contest.update(
        {
          name,
          users,
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
          message: `Contests '${id}' doesn't exists`,
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
