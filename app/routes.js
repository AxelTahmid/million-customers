const customerRoutes = require('./customers')

module.exports = async function (app) {
    app.setNotFoundHandler(function (request, reply) {
        reply.code(404).send({ error: true, message: '404 - Route Not Found' })
    })
    /**
     * * Service Routes Registration with Prefix
     */
    app.register(customerRoutes, { prefix: 'v1/customer' })
}
