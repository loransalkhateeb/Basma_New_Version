const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Blog = require('../Models/BlogsModel');
const Courses = require('../Models/Courses');
const User = require('../Models/UserModel');
const Payment = require('../Models/PaymentsModel');


const CourseUsers = sequelize.define('course_users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    payment_status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255],
        },
    },
}, {
    timestamps: false,
    tableName: 'course_users',
    indexes: [
       
        {
            fields: ['course_id'],
            name: 'idx_course_id', 
        },
        
        {
            fields: ['user_id'],
            name: 'idx_user_id', 
        },
        
        {
            fields: ['payment_id'],
            name: 'idx_payment_id', 
        },
    ]
});


Courses.hasMany(CourseUsers, {
    foreignKey: 'course_id',
    as: 'courseUsers',
});
CourseUsers.belongsTo(Courses, {
    foreignKey: 'course_id',
    as: 'course',
});

User.hasMany(CourseUsers, {
    foreignKey: 'user_id',
    as: 'userCourses',
});
CourseUsers.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
});

Payment.hasOne(CourseUsers, {
    foreignKey: 'payment_id',
    as: 'paymentDetails',
});
CourseUsers.belongsTo(Payment, {
    foreignKey: 'payment_id',
    as: 'payment',
});


module.exports = CourseUsers;
