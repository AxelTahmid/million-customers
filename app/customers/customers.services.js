/* eslint-disable no-useless-escape, max-len,quotes, no-console  */

const { parse } = require('csv-parse')
const { createReadStream } = require('fs')
const { join } = require('node:path')

// approach 1: utilize ReadStream and piping
// approach 2: load it in sql, LOAD DATA command

// 89886.445 ms / 1.49 minute - with stream pause feature - no filter

/**
 * * parse csv, create users
 */
const createUser = async (app, fileName) => {
    const start = Date.now()
    const filePath = join(__dirname, '..', '..', 'data', fileName)

    app.log.info(`filePath here: ${filePath}`)

    const batchSize = 25000
    const batch = []

    const csvStream = createReadStream(filePath).pipe(
        parse({
            delimiter: ',',
            from_line: 1,
            columns: [
                'first_name',
                'last_name',
                'city',
                'state',
                'postal_code',
                'contact_number',
                'email',
                'ip_address'
            ]
        })
    )

    const action = new Promise((resolve, reject) => {
        csvStream
            .on('data', async function (row) {
                batch.push(row)

                if (batch.length >= batchSize) {
                    csvStream.pause()
                    await app.knex.batchInsert(
                        'draft_customers',
                        batch,
                        batchSize
                    )
                    batch.length = 0
                    csvStream.resume()
                }
            })

            .on('end', async function () {
                if (batch.length > 0) {
                    await app.knex.batchInsert(
                        'draft_customers',
                        batch,
                        batchSize
                    )
                }

                const end = Date.now()
                resolve(`Execution time: ${end - start} ms`)
            })
            .on('error', function (error) {
                app.log.error({ error }, `${error.message}`)
                reject(error)
            })
    })

    return await action
}

module.exports = { createUser }
