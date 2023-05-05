/* eslint-disable no-useless-escape, max-len,quotes, no-console  */

const { parse } = require('csv-parse')
const { createReadStream } = require('fs')
const { join } = require('node:path')

// approach 1: load it using node.js streams and process, batchInsert
// approach 2: load it in sql, LOAD Data
// approach 3: create seeder files, write stream

/**
 * * parse csv, create users
 */
const createUser = async (app, fileName) => {
    const filePath = join(__dirname, '..', '..', 'data', fileName)

    app.log.info(`filePath here: ${filePath}`)

    const start = Date.now()

    const batchSize = 10000
    const rows = []
    const action = new Promise((resolve, reject) => {
        createReadStream(filePath)
            .pipe(
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
            .on('data', async function (row) {
                rows.push(row)

                if (rows.length >= batchSize) {
                    await app.knex.batchInsert(
                        'draft_customers',
                        rows,
                        batchSize
                    )
                    rows.length = 0
                }
            })
            .on('end', async function () {
                if (rows.length > 0) {
                    await app.knex.batchInsert(
                        'draft_customers',
                        rows,
                        batchSize
                    )
                }

                app.log.info('Process Completed.')
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
