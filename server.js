require('dotenv').config()

const Fastify = require('fastify')
const closeWithGrace = require('close-with-grace')

let dev = process.env.NODE_ENV

if (dev && dev === 'development') {
    dev = true
} else {
    dev = false
}

const devLogger = {
    target: 'pino-pretty',
    options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
    }
}

/**
 * * give array of ip for trustproxy in production
 */
const app = Fastify({
    trustProxy: true,
    logger: {
        transport: dev ? devLogger : undefined
    }
})
// * configuration decorator and defaults
app.decorate('conf', require('./config/environment'))
    .register(require('@fastify/helmet'), { global: true })
    .register(require('@fastify/cors'), app.conf.cors)
    .register(require('@fastify/formbody'))
    .register(require('./plugins/jwt'))
    .register(require('@fastify/sensible'))
    .register(require('@fastify/redis'), app.conf.redis)

// * rate-limit redis
const IORedis = require('ioredis')
app.conf.rate_limit.redis = new IORedis(app.conf.redis)
app.register(require('@fastify/rate-limit'), app.conf.rate_limit)

// * bullMQ
app.register(require('./plugins/bullMQ'))
/**
 * * MySQL Database
 */
const knex = require('./plugins/knex')
if (dev) {
    app.log.info('db: development')
    const { development } = require('./knexfile')
    app.register(knex, development)
} else {
    app.log.info('db: production')
    app.register(knex, app.conf.sql)
}

/**
 * * Register the app directory
 */
app.register(require('./app/routes'))

/**
 * * delay is the number of milliseconds for the graceful close to finish
 */
const closeListeners = closeWithGrace(
    { delay: 2000 },
    async function ({ err }) {
        app.log.info('graceful shutdown -> entered')
        if (err) {
            app.log.error(err)
        }
        await app.close()
    }
)

app.addHook('onClose', async (instance, done) => {
    closeListeners.uninstall()
    app.log.info('graceful shutdown -> sucessful')
    done()
})

// * Run the server!
const start = async () => {
    try {
        await app.listen({
            port: process.env.PORT || 3000,
            host: process.env.HOST || '0.0.0.0'
        })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
