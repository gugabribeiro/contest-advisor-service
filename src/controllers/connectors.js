const cache = require('../cache')
const normal = require('gaussian')
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
  recommendedProblems: async (req, res) => {
    const { name } = req.params
    const { count, contestants, strict = false, topics = [] } = req.body
    const validation = validate(['count', 'contestants'], {
      count,
      contestants,
    })
    console.log(count, strict, contestants, topics)
    if (!validation.value || contestants.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).send({
        message: `Missing required fields: [${validation.missing.join(',')}]`,
      })
    }
    try {
      const connector = await Connector.findByPk(name)
      if (!connector) {
        return res.status(StatusCodes.NOT_FOUND).send({
          message: `Connector '${name}' doesn't exists`,
        })
      }
      const client = new ConnectorClient(connector.toJSON())
      let solvedBySome = {}
      for (const user of contestants) {
        console.log(user, 'submissions')
        const submissions = await client.submissions(user).catch(() => [])
        for (const submission of submissions) {
          solvedBySome[submission.problemId] = true
        }
      }
      const problems = await client.problems()
      let problemsByLevel = {}
      for (const problem of problems) {
        if (problem.id in solvedBySome) {
          continue
        }
        let containsSome = topics.length === 0
        for (const topic of problem.topics) {
          if (topics.includes(topic)) {
            containsSome = true
          }
        }
        if (!containsSome) {
          continue
        }
        if (strict) {
          let diverge = false
          for (const topic of topics) {
            if (!problem.topics.includes(topic)) {
              diverge = true
            }
          }
          if (diverge) {
            continue
          }
        }
        if (!(problem.level in problemsByLevel)) {
          problemsByLevel[problem.level] = []
        }
        problemsByLevel[problem.level].push(problem.id)
      }
      let maxLevel = 0
      let sumLevels = 0
      for (const user of contestants) {
        let profile = await cache.get(user)
        if (!profile) {
          profile = await client.profile(user).catch(() => ({
            level: 0,
          }))
        }
        console.log(profile)
        cache.set(user, profile, 86400)
        sumLevels += profile.level
        maxLevel = Math.max(maxLevel, profile.level)
      }
      let meanLevel = sumLevels / contestants.length
      let sigmaLevel = maxLevel - meanLevel
      if (sigmaLevel === 0) {
        // Prevent sigma equals to 0
        sigmaLevel = 500
      }
      const distribution = normal(meanLevel, sigmaLevel * sigmaLevel)
      const samples = distribution.random(count).map((sample) => {
        const nextInt = Math.floor(sample)
        return nextInt - (nextInt % 100)
      })
      let recommendedProblems = []
      const availableLevels = Object.keys(problemsByLevel)
      for (const sample of samples) {
        let nearest = -1
        for (let index = 0; index < availableLevels.length; ++index) {
          // There's no more problems for this level
          if (problemsByLevel[availableLevels[index]].length === 0) {
            continue
          }
          if (
            nearest === -1 ||
            Math.abs(sample - availableLevels[index]) <
              Math.abs(sample - availableLevels[nearest])
          ) {
            nearest = index
          }
        }
        // There's no more problems
        if (nearest === -1) {
          break
        }
        // Getting the first problem
        const chosenLevel = availableLevels[nearest]
        // Get random problem from this level
        const chosenIndex = Math.floor(
          Math.random() * problemsByLevel[chosenLevel].length
        )
        recommendedProblems.push(problemsByLevel[chosenLevel][chosenIndex])
        // Removing the selected problem in order to avoid duplicates
        problemsByLevel[chosenLevel] = problemsByLevel[chosenLevel].splice(
          chosenIndex,
          1
        )
        // Prevent to take the same problem multiple times
        problemsByLevel[chosenLevel].pop()
      }
      return res.status(StatusCodes.OK).send({
        maxLevel,
        meanLevel,
        sigma: sigmaLevel,
        samples,
        problems: recommendedProblems,
      })
    } catch (err) {
      console.log(err)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(wrong)
    }
  },
}

module.exports = Connectors
