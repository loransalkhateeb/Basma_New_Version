const Blog = require('../Models/BlogsModel');
const Department = require('../Models/DepartmentModel');

Blog.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(Blog, { foreignKey: 'department_id' });

module.exports = { Blog, Department };
