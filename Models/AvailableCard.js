const { DataTypes } = require('sequelize');
const sequelize = require('../Config/dbConnect'); 
const Governorate = require('../Models/Governorate'); 

const AvailableCard = sequelize.define('AvailableCard', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  governorate_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Governorate,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  mapslink: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'availablecards',
  timestamps: false,
});

Governorate.hasMany(AvailableCard, {
  foreignKey: 'governorate_id',
})
AvailableCard.belongsTo(Governorate, {
  foreignKey: 'governorate_id',
});

module.exports = AvailableCard;
