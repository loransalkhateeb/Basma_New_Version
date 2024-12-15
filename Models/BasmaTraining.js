const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');  

const BasmaTraining = sequelize.define('basmatraining', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descr: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,  
});

module.exports = BasmaTraining;
