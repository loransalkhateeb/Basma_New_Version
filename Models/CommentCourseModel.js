// Models/CommentCoursesmodel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 
const Courses=require('../Models/Courses')
const CommentCourse = sequelize.define('CommentCourse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  rating:{
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  action: {
    type: DataTypes.STRING,
    defaultValue: 'not approved',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false, 
});


module.exports = CommentCourse;
