const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Blog = require('../Models/BlogsModel'); 

const Tag = sequelize.define('Tag', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    tag_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [1, 255]
        }
    },
}, {
    timestamps: false,
    tableName: 'tag' 
});





module.exports = Tag;
