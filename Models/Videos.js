const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Course = require('../Models/Courses'); 

const Video = sequelize.define('Video', {
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'videos',
});

Video.belongsTo(Course, { foreignKey: 'course_id' });

module.exports = Video;
