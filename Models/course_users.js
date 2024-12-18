const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 

const Course_Users = sequelize.define('Course_Users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses', 
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User', 
      key: 'id'
    }
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Payment', 
      key: 'id'
    }
  },
  address:{
    type: DataTypes.STRING,
    allowNull: false
  },
  Payment_Status:{
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'payments', 
  timestamps: true
});

module.exports = Course_Users;
