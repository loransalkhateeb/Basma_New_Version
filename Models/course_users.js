const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 
const department = require('../Models/DepartmentModel')
const Courses = require('../Models/CourseUsers')
const Coupons = require('../Models/CouponsModel')

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


department.hasMany(Course_Users, { foreignKey: 'department_id' });
Course_Users.belongsTo(department, { foreignKey: 'department_id' }); 




Coupons.hasMany(Course_Users, { foreignKey: 'coupon_id' })
Course_Users.belongsTo(Coupons, { foreignKey: 'coupon_id' });

module.exports = Course_Users;
