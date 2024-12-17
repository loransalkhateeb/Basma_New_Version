const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');

const DynamicBlog = sequelize.define('DynamicBlog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descr: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

},{
  timestamps: false,
});



module.exports = DynamicBlog;
