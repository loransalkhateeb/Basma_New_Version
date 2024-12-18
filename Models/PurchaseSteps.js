const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 

const Purchasesteps = sequelize.define('purchasesteps', {
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
    tableName: 'purchasesteps' 
});


module.exports = Purchasesteps;
