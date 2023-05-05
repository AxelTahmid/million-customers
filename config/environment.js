module.exports = {
    cors: {
        origin: ['http://localhost:3001', 'http://localhost:3000'],
        method: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Access-Control-Allow-Origin',
            'Origin'
        ],
        credentials: true,
        optionsSuccessStatus: 200
    },
    sql: {
        client: 'mysql2',
        pool: {
            propagateCreateError: false
        },
        connection: {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        },
        asyncStackTraces: false,
        debug: false
    },
    multer: {
        limits: {
            fieldNameSize: 100, // Max field name size in bytes
            fieldSize: 100, // Max field value size in bytes
            fields: 2, // Max number of non-file fields
            fileSize: 1000000, // the max file size in bytes, 1MB
            files: 1 // Max number of file fields
        }
    }
}
