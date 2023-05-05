const { createUser } = require('./customers.services')

/**
 * * Handler POST /v1/user/admin/
 */
const create = async function (request, reply) {
    const data = await createUser(this, request.query.filename)

    reply.code(201)

    return {
        error: false,
        message: 'csv parsed and inserted',
        data
    }
}
module.exports = { create }
