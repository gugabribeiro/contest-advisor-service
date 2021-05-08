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
  connector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  users: {
    type: DataTypes.STRING({ length: 2048 }),
    allowNull: false,
    get() {
      return this.getDataValue('users').split(',')
    },
    set(users) {
      this.setDataValue('users', users.join(','))
    },
  },
  problems: {
    type: DataTypes.STRING({ length: 2048 }),
    allowNull: false,
    get() {
      return this.getDataValue('problems').split(',')
    },
    set(problems) {
      this.setDataValue('problems', problems.join(','))
    },
  },
})

module.exports = Contest
