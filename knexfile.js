const { resolve } = require('node:path')
const { createReadStream } = require('fs')
require('dotenv').config()

module.exports = {
    development: {
        client: 'mysql2',
        acquireConnectionTimeout: 10000,
        pool: {
            min: 1,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: resolve(__dirname, 'database/migrations')
        },
        seeds: {
            directory: resolve(__dirname, 'database/seeds')
        },
        connection: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'arektacoinstore',
            port: process.env.DB_PORT || '3306'
            // infileStreamFactory: path => createReadStream(path)
        },
        asyncStackTraces: false,
        debug: false
    }
}

// https://github.com/sidorares/node-mysql2/issues/1080
