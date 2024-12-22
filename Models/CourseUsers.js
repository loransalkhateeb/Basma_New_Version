// const { DataTypes } = require('sequelize');
// const sequelize = require('../Config/dbConnect');
// const department = require('../Models/DepartmentModel');
// const User = require('./UserModel');
// const Course_Users = require('./course_users');
// const course = require('../Models/Courses')




// const course_users = sequelize.define('course_users', {
//     id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//         allowNull: false
//     },
//     subject_name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         validate: {
//             notEmpty: true,
//             len: [1, 255]
//         }
//     },
//     before_offer:{
//         type: DataTypes.STRING,
//         allowNull: false,
//         validate: {
//             notEmpty: true,
//             len: [1, 255]
//         }
//     },
//     after_offer:{
//         type: DataTypes.STRING,
//         allowNull: false,
//         validate: {
//             notEmpty: true,
//             len: [1, 255]
//         }
//     },
//     coupon:{
//         type: DataTypes.STRING,
//         allowNull: true,
//         validate: {
//             len: [1, 255]
//         }
//     },
//     descr:{
//         type: DataTypes.TEXT,
//         allowNull: false,
//         validate: {
//             notEmpty: true
//         }
//     },
//     std_num:{
//         type: DataTypes.STRING,
//         allowNull: false
//     },
//     rating:{
//         type: DataTypes.DECIMAL(2, 1),
//         allowNull: false,
//         validate: {
//             min: 1,
//             max: 5
//         }
//     },
//     img:{
//         type: DataTypes.STRING,
//         allowNull: true,
//         validate: {
//             len: [1, 255]
//         }
//     },
//     defaultvideo:{
//         type: DataTypes.STRING,
//         allowNull: false,
//         validate: {
//             notEmpty: true,
//             len: [1, 255]
//         }
//     },
//     total_video_duration:{
//         type: DataTypes.STRING,
//         allowNull: true,
//         validate: {
//             len: [1, 255]
//         }
//     },
//     created_at:{
//         type: DataTypes.DATE,
//         defaultValue: DataTypes.NOW
//     },
//     file_book:{
//         type: DataTypes.STRING,
//         allowNull: true,
//         validate: {
//             len: [1, 255]
//         }
//     }

// }, {
//     timestamps: false,
//     tableName: 'courses'
// });


// User.hasMany(Course_Users, { foreignKey: 'department_id' });
// Course_Users.belongsTo(User, { foreignKey: 'department_id' }); 


// course.hasMany(Course_Users, { foreignKey: 'course_id'})
// Course_Users.belongsTo(course, { foreignKey: 'course_id' });
// module.exports = course_users;