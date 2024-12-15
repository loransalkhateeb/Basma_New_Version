const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Department = require('../Models/DepartmentModel'); 
const Tag = require('../Models/TagModel');

// تعريف نموذج Blog
const Blog = sequelize.define('Blog', {
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
    author: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
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
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        defaultValue: 'not approved'
    }
}, {
    timestamps: false,
    tableName: 'blogs'
});

// علاقة واحد لواحد بين Blog و Department
Blog.belongsTo(Department, {
    foreignKey: 'department_id',
});
Department.hasOne(Blog, {
    foreignKey: 'department_id',
});

// علاقة واحد لواحد بين Blog و Tag
Blog.hasOne(Tag, { foreignKey: 'blog_id' });
Tag.belongsTo(Blog, { foreignKey: 'blog_id' });

module.exports = Blog;
