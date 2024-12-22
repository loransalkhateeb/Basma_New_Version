const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Coupon = require('./CouponsModel');
const Department = require('./DepartmentModel');
const Course = require('./Courses');  
const User = require('./UserModel');
const CourseUser = require('../Models/course_users');  

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Department,
      key: 'id',
    },
  },
  course_id: {  
    type: DataTypes.INTEGER,
    allowNull: true,  
    references: {
      model: Course, 
      key: 'id',
    },
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  coupon_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Coupon,
      key: 'id',
    },
  },
}, {
  indexes: [
    { name: 'idx_payment_id', fields: ['id'] },
    { name: 'idx_payment_student_name', fields: ['student_name'] },
    { name: 'idx_payment_email', fields: ['email'] },
    { name: 'idx_payment_address', fields: ['address'] },
    { name: 'idx_payment_phone', fields: ['phone'] },
    { name: 'idx_payment_department_id', fields: ['department_id'] },
    { name: 'idx_payment_user_id', fields: ['user_id'] },
    { name: 'idx_payment_coupon_id', fields: ['coupon_id'] },
  ],
});


Payment.belongsTo(Coupon, { foreignKey: 'coupon_id' });
Payment.belongsTo(Department, { foreignKey: 'department_id' });
Payment.belongsTo(Course, { foreignKey: 'course_id' });

Payment.hasMany(CourseUser, { foreignKey: 'payment_id' });
CourseUser.belongsTo(Payment, { foreignKey: 'payment_id' });

module.exports = Payment;
