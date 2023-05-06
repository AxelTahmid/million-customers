const { parse, exportCSV } = require('./customers.handlers')

module.exports = async function (fastify) {
    fastify.route({
        method: 'POST',
        url: '/parse',
        handler: parse
    })
}
