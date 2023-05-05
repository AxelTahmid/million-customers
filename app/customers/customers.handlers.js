const { parseCustomersToDB, exportTabletoCSV } = require('./customers.services')

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
/**
 * * Handler POST /v1/customer/export
 */
const exportCSV = async function (request, reply) {
    const data = await exportTabletoCSV(this, request.query.filename)

    reply.code(201)

    return {
        error: false,
        message: 'batch export table to csv completed',
        data
    }
}
module.exports = { parse, exportCSV }
