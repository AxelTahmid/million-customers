/* eslint-disable no-useless-escape, max-len,quotes, no-console  */

const { parse } = require('csv-parse')
const { createReadStream } = require('fs')
const { join } = require('node:path')

// approach 1: utilize ReadStream and piping
// approach 2: load it in sql, LOAD DATA command

// 87418.79 ms / 1.45 minute -  no filter for parse and insert
// 93083.61 ms / 1.55 minute - with filter for parse and insert

/**
 * * parse csv, create users
 */
const createUser = async (app, fileName) => {
    const start = Date.now()
    const filePath = join(__dirname, '..', '..', 'data', fileName)

    app.log.info(`filePath here: ${filePath}`)

    const batchSize = 25000
    // const batch = []
    const batchValid = []
    const batchInvalid = []

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
    const phoneRegex = /^1?\s?(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const uniqueRows = new Set()

    const action = new Promise((resolve, reject) => {
        csvStream
            .on('data', async function (row) {
                if (
                    phoneRegex.test(row.contact_number) &&
                    emailRegex.test(row.email)
                ) {
                    const uniqueKey = `${row.contact_number}-${row.email}`
                    if (!uniqueRows.has(uniqueKey)) {
                        uniqueRows.add(uniqueKey)
                        batchValid.push(row)
                    } else {
                        batchInvalid.push(row)
                    }
                } else {
                    batchInvalid.push(row)
                }

                if (batchValid.length >= batchSize) {
                    csvStream.pause()
                    await app.knex.batchInsert(
                        'valid_customers',
                        batchValid,
                        batchSize
                    )
                    batchValid.length = 0
                    csvStream.resume()
                }

                if (batchInvalid.length >= batchSize) {
                    csvStream.pause()
                    await app.knex.batchInsert(
                        'invalid_customers',
                        batchInvalid,
                        batchSize
                    )
                    batchInvalid.length = 0
                    csvStream.resume()
                }
            })
            .on('end', async function () {
                if (batchValid.length > 0) {
                    await app.knex.batchInsert(
                        'valid_customers',
                        batchValid,
                        batchSize
                    )
                }
                if (batchInvalid.length > 0) {
                    await app.knex.batchInsert(
                        'invalid_customers',
                        batchInvalid,
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
