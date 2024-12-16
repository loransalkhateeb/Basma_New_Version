const { DataTypes } = require('sequelize');
const db = require('../Config/dbConnect'); 

const Slider = db.define('Slider', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  descr: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  btn_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  img: {
    type: DataTypes.STRING,
    allowNull: true
  },
  slider_img: {
    type: DataTypes.STRING,
    allowNull: false
  },
  page: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'slider', 
  timestamps: false   
});

module.exports = Slider;
