const { DataTypes } = require('sequelize')

const database = require('../database')

const Problem = database.define('Problem', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  connector: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  topics: {
    type: DataTypes.STRING({ length: 500 }),
    allowNull: false,
    get() {
      return this.getDataValue('topics').split(',')
    },
    set(topics) {
      this.setDataValue('topics', topics.join(','))
    },
  },
})

module.exports = Problem
