'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('User', 'mfa_secret', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('User', 'mfa_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('User', 'mfa_secret');
    await queryInterface.removeColumn('User', 'mfa_enabled');
  },
};
