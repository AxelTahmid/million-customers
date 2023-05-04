module.exports = {
    cors: {
        origin: [
            'http://localhost:3001',
            'http://localhost:3000'
        ],
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
        acquireConnectionTimeout: 10000,
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
    redis: {
        host: process.env.REDIS_URL || 'localhost',
        port: process.env.REDIS_PORT || '6379',
        maxRetriesPerRequest: null
    },
    rate_limit: {
        max: 15,
        timeWindow: 1000 * 60,
        nameSpace: 'uniq:limit:',
        keyGenerator: request => {
            const unique =
                request.headers['x-real-ip'] ||
                request.headers['x-forwarded-for'] ||
                request.raw.ip
            return `${unique}:${request.routerPath}`
        },
        allowList: function (request, key) {
            return request.headers['x-app-client-id'] === 'dev-team'
        }
        // make all req except login on admin panel limit free
    },
    mailer: {
        defaults: {
            from:
                process.env.MAILER_DEFAULT_FROM ||
                'ArektaCoinStore <info.arektacoinstore@gmail.com>',
            subject: 'No-Reply ArektaCoinStore'
        },
        transport: {
            service: 'gmail',
            auth: {
                user:
                    process.env.MAILER_USER || 'info.arektacoinstore@gmail.com',
                pass: process.env.MAILER_PASSWORD || 'xjqscmchhemexapc'
            }
        }
    },
    bullMQ: {
        queue: process.env.QUEUE_NAME || 'mail-queue',
        max: parseInt(process.env.QUEUE_GLOBAL_CONCURRENCY) || 60,
        duration: parseInt(process.env.QUEUE_LIMIT_DURATION) || 1000,
        concurrency: parseInt(process.env.QUEUE_CONCURRENCY) || 10
    }
}
// for best rate limit
// redis: {
// 	host: process.env.REDIS_URL || 'localhost',
// 	port: process.env.REDIS_PORT || '6379',
// 	connectTimeout: 500,
// 	maxRetriesPerRequest: 1
// },
