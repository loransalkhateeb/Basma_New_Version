const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 

const Payment = sequelize.define('Payment', {
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
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'department', 
      key: 'id'
    }
  },
  email:{
    type: DataTypes.STRING,
    allowNull: false
  },
  address:{
    type: DataTypes.STRING,
    allowNull: false
  },
  phone:{
    type: DataTypes.STRING,
    allowNull: false
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Coupon', 
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'User', 
      key: 'id'
    }
  },
  student_name:{
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'payments', 
  timestamps: true
});

module.exports = Payment;
