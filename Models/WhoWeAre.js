const { DataTypes } = require('sequelize');
const  sequelize  = require('../Config/dbConnect');  

const Whoweare = sequelize.define('Whoweare', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,  
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,  
  },
}, {
  timestamps: false, 
  tableName: 'whoweare',  
});

module.exports =  Whoweare ;
