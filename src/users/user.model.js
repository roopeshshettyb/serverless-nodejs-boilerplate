const { DataTypes } = require('sequelize');
const { sequelize } = require('../common-services/datasources/sequelize');
const constants = require('../config/constants');
const { log } = require('../common-services/general/logger');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth'
    },
    gender: {
        type: DataTypes.ENUM(constants.MODEL_DEFAULTS.USER.GENDER),
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    role: {
        type: DataTypes.ENUM(constants.MODEL_DEFAULTS.ROLES.ALL),
        allowNull: false,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    profilePicture: {
        type: DataTypes.STRING,
        field: 'profile_picture',
        allowNull: true,
    },
    permissions: {
        type: DataTypes.JSON(DataTypes.JSON),
        allowNull: true
    }
}, {
    tableName: constants.MODEL_DEFAULTS.UNIQUE_KEYS.USERS, timestamps: true, underscored: true
});
try {
    User.sync({ alter: constants.DATABASES.POSTGRES.MODEL_ALTER });
} catch (error) {
    log({ source: 'User Model', error });
}
module.exports = User;
