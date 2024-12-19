const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 

const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  img: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  device_id: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
  reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  reset_token_expiration: {
    type: DataTypes.DATE,
    allowNull: true,
  }
}, {
  timestamps: false, 
});




module.exports = User;
