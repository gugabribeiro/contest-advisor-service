const { DataTypes } = require('sequelize')

const database = require('../database')

const Contest = database.define('Contest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV1,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startTimeInSeconds: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  durationInSeconds: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  penalty: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  redirectUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  connector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contestants: {
    type: DataTypes.STRING({ length: 2048 }),
    allowNull: false,
    get() {
      const contestants = this.getDataValue('contestants')
      if (!contestants || !contestants.length) {
        return []
      }
      return contestants.split(',')
    },
    set(contestants) {
      this.setDataValue('contestants', contestants.join(','))
    },
  },
  problems: {
    type: DataTypes.STRING({ length: 2048 }),
    allowNull: false,
    get() {
      const problems = this.getDataValue('problems')
      if (!problems || !problems.length) {
        return []
      }
      return problems.split(',')
    },
    set(problems) {
      this.setDataValue('problems', problems.join(','))
    },
  },
})

module.exports = Contest
