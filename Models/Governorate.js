const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const AvailableCard = require('./AvailableCard');
const Governorate = sequelize.define('Governorate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  governorate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'governorate',
  timestamps: false,
});

module.exports = Governorate;
