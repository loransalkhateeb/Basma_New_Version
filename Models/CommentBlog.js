const { DataTypes } = require("sequelize");
const sequelize = require("../Config/dbConnect"); 

const CommentBlog = sequelize.define("CommentBlog", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM("not approved", "approved"),
    defaultValue: "not approved",
  }
}, {
  timestamps: false 
});

module.exports = CommentBlog;
