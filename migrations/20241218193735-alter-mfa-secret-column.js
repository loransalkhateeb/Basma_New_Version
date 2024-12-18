'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('User', 'mfa_secret', {
      type: Sequelize.STRING(512),
      allowNull: true, 
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('User', 'mfa_secret', {
      type: Sequelize.STRING(255), 
      allowNull: true, 
    });
  }
};
