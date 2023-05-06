const { parseCustomersToDB } = require('./customers.services')

/**
 * * Handler POST /v1/customer/parse
 */
const parse = async function (request, reply) {
    const data = await parseCustomersToDB(this, request.query.filename)

    reply.code(201)

    return {
        error: false,
        message: 'csv parsed and inserted',
        data
    }
}

module.exports = { parse }
