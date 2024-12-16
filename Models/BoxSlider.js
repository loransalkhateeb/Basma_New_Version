const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');


const BoxSlider = sequelize.define('BoxSlider', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
  tableName: 'boxslider', 
  timestamps: false,
});

module.exports = BoxSlider;
