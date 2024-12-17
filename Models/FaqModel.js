const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');

const Faq = sequelize.define('Faq', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    ques: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 500]  
        }
    },
    ans: {
        type: DataTypes.TEXT,  
        allowNull: false,
        validate: {
            notEmpty: true
        }
    }
}, {
    timestamps: false,  
    tableName: 'faq' 
});

module.exports = Faq;
