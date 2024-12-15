const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Blog = require('../Models/BlogsModel');

const Department = sequelize.define('Department', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0
        }
    }
}, {
    timestamps: false,
    tableName: 'department'
});



module.exports = Department;
