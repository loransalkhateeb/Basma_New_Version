const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const departments = require('../Models/DepartmentModel');
const Course = require('../Models/Courses'); 

const teachers = sequelize.define('teachers', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    teacher_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    descr: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    img: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: [1, 255]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    department_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: departments,  
            key: 'id'
        },
        onDelete: 'CASCADE',
    }
}, {
    timestamps: false,
    tableName: 'teacher'
});


teachers.belongsTo(departments, { foreignKey: 'department_id' }); 
departments.hasMany(teachers, { foreignKey: 'department_id' });


teachers.hasMany(Course, { foreignKey: 'teacher_id' });  
Course.belongsTo(teachers, { foreignKey: 'teacher_id' }); 

module.exports = teachers;