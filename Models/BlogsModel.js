const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');
const Department = require('../Models/DepartmentModel'); 
const Tag = require('../Models/TagModel');
const CommentBlog = require('../Models/CommentBlog')

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
    timestamps: true,
    tableName: 'blogs'
});


Blog.belongsTo(Department, {
    foreignKey: 'department_id',
});
Department.hasOne(Blog, {
    foreignKey: 'department_id',
});


Blog.hasMany(Tag, { foreignKey: 'blog_id' });
Tag.belongsTo(Blog, { foreignKey: 'blog_id' });

Blog.hasMany(CommentBlog, { foreignKey: "blog_id" });
CommentBlog.belongsTo(Blog, { foreignKey: "blog_id" });




module.exports = Blog;
