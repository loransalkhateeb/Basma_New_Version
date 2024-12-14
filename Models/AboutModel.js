const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 

const About = sequelize.define('About', {
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
    descr: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    img: {
        type: DataTypes.STRING, 
        allowNull: true, 
    }
}, {
    timestamps: false, 
    tableName: 'about' 
});


module.exports = About;
