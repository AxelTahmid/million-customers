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
    .register(require('@fastify/sensible'))
    .register(require('@fastify/cors'), app.conf.cors)
// .register(require('@fastify/multipart'), app.conf.multer)

/**
 * * MySQL Database
 */
const knex = require('./plugins/knex')
app.register(knex, app.conf.sql)

/**
 * * Register the app directory
 */
app.register(require('./app/routes'))

/**
 * * graceful shutdown
 * * delay is the number of milliseconds to finish
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
