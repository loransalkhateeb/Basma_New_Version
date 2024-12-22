const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const User = require('../Models/UserModel'); 
const Teacher = require('../Models/TeacherModel');  

const teacher_students = sequelize.define('teacher_students', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  
}, {
  indexes: [
    { name: 'idx_teacher_student_id', fields: ['id'] },
  ],
});


teacher_students.belongsTo(User, { foreignKey: 'student_id', as: 'student' });


teacher_students.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

module.exports = teacher_students;
