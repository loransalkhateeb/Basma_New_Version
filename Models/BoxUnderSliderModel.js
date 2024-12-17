const { DataTypes } = require('sequelize');
const db = require('../Config/dbConnect');  

const BoxSlider = db.define('BoxSlider', {
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

module.exports = BoxSlider;
