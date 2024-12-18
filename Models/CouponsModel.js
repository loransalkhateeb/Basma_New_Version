
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 

const Coupon = sequelize.define('Coupon', {
  id:{
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  coupon_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  coupon_type: {
    type: DataTypes.ENUM('course', 'department'),
    allowNull: false,
  },
  expiration_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'department',
      key: 'id',
    },
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'courses',
      key: 'id',
    },
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  timestamps: false,
  tableName: 'coupons',
});

module.exports = Coupon;
