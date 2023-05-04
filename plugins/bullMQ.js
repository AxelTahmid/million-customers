const fp = require('fastify-plugin')
const { Queue, Worker } = require('bullmq')
const IORedis = require('ioredis')
const jobProcessor = require('../app/mail/index')

const fastifyBullMQ = async function (fastify, options, next) {
    try {
        const redis = new IORedis(fastify.conf.redis)

        if (!fastify.queue) {
            const queue = new Queue(fastify.conf.bullMQ.queue, {
                connection: redis,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000
                    }
                }
            })

            fastify.decorate('queue', queue)
        }

        if (!fastify.worker) {
            const worker = new Worker(fastify.conf.bullMQ.queue, jobProcessor, {
                connection: redis,
                // autorun: false,
                concurrency: fastify.conf.bullMQ.concurrency,
                limiter: {
                    max: fastify.conf.bullMQ.max,
                    duration: fastify.conf.bullMQ.duration
                }
            })

            fastify.decorate('worker', worker)

            fastify.worker.on('completed', (job, returnvalue) => {
                fastify.log.info({ job, returnvalue }, 'Job Completed')
            })

            fastify.worker.on('failed', (job, error) => {
                fastify.log.error({ job, error }, 'Job Failed')
            })

            fastify.worker.on('error', error => {
                fastify.log.error(
                    { error },
                    'Unhandled Exception Thrown by Worker'
                )
            })

            fastify.worker.on('drained', () => {
                fastify.log.info(
                    `${fastify.conf.bullMQ.queue} - is drained, no more jobs left`
                )
            })

            // fastify.worker.run()

            // no needed to close queue, global
            fastify.addHook('onClose', (fastify, done) => {
                if (fastify.worker === worker) {
                    fastify.worker.close()
                }
            })
        }

        next()
    } catch (err) {
        next(err)
    }
}

module.exports = fp(fastifyBullMQ)
