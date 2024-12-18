const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');

const Contact = sequelize.define('contact', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    descr: {
        type: DataTypes.TEXT,  
        allowNull: true,
    },
    phone:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    email:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    facebook:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    whatsup:{
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: false,  
    tableName: 'contact' 
});

module.exports = Contact;
