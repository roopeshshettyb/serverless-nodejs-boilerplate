const { Sequelize } = require('sequelize');
const constants = require('../../config/constants');
const pg = require('pg');
const { log } = require('../general/logger');

const syncDB = constants.DATABASES.POSTGRES.DB_ALTER;

let defaultSequelizeOptions = {
    dialect: 'postgres',
    dialectModule: pg,
    host: constants.DATABASES.POSTGRES.HOST,
    port: constants.DATABASES.POSTGRES.PORT,
    logging: constants.DATABASES.POSTGRES.LOGS,
};

if (constants.DATABASES.POSTGRES.USE_SSL) {
    defaultSequelizeOptions = {
        ...defaultSequelizeOptions,
        ssl: true,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    };
}

const sequelize = new Sequelize(constants.DATABASES.POSTGRES.DATABASE,
    constants.DATABASES.POSTGRES.USERNAME,
    constants.DATABASES.POSTGRES.PASSWORD,
    defaultSequelizeOptions
);
function authenticateConnection() {
    sequelize
        .authenticate()
        .then(() => {
            log({ message: 'Connection has been established successfully.' });
            if (syncDB) {
                return alterDatabase(sequelize);
            } else {
                return true;
            }
        })
        .then(() => {
            if (syncDB) log({ message: 'DB Altered' });
            return true;
        })
        .catch((error) => {
            log({ message: 'Unable to connect to the database:', error, source: 'authenticateConnection' });
        });
};

function alterDatabase(sequelize) {
    return sequelize.sync({ force: syncDB });
};

authenticateConnection();

module.exports = { sequelize, authenticateConnection, alterDatabase };
