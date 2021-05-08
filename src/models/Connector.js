const { DataTypes } = require('sequelize')

const database = require('../database')

const Connector = database.define('Connector', {
  name: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
})

module.exports = Connector
