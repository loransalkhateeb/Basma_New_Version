
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect');  

const Library = sequelize.define('Library', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  book_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  page_num: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_book: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
}, {
  timestamps: true,
  tableName: 'library'
});


Library.belongsTo(require('../Models/DepartmentModel'), {
  foreignKey: 'department_id',
  as: 'department'
});

module.exports = Library;
