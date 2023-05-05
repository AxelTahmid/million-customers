/**
 * * approach 1: utilize ReadStream and piping, chunk it all, store it.
 * * approach 2: load it in sql, LOAD DATA command in draft, postprocess it
 * - went with approach 1 for security concerns
 * - could have used the same parse stream to write csv files
 * - but it makes the whole code unreadable and sphagetti.
 * - instruction clear on sequential steps so keeping it seprate
 * - negligible loss in performance but
 * - major reduce in technical debt
 */
const { parse } = require('csv-parse')
const { createReadStream, createWriteStream } = require('fs')
const { pipeline } = require('stream')
const { join } = require('node:path')

/**
 * * parse csv, insert into DB
 * ! 87418.79 ms / 1.45 minute -  no filter for parse and insert
 * ! 93083.61 ms / 1.55 minute - with filter for parse and insert
 */
const parseCustomersToDB = async (app, fileName) => {
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

/**
 * * parse table, batch export to csv
 * ! 7597 ms / 7.5 seconds
 */
const exportTabletoCSV = async (app, fileName) => {
    const start = Date.now()
    const filePath = join(__dirname, '..', '..', 'data', fileName)
    const outputPath = join(__dirname, '..', '..', 'data', 'output', './')
    app.log.info({ outputPath }, 'data here: ')

    const batchSize = 10000
    let validRowCount = 0
    let validFileCount = 1

    let validFileStream = createWriteStream(
        `${outputPath}valid_customers_${validFileCount}.csv`
    )
    const invalidFileStream = createWriteStream(
        `${outputPath}invalid_customers.csv`
    )

    const csvStream = createReadStream(filePath)
    const phoneRegex = /^1?\s?(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const uniqueRows = new Set()

    const action = new Promise((resolve, reject) => {
        pipeline(csvStream, parse({ delimiter: ',' }), err => {
            if (err) {
                app.log.error({ error: err }, `${err.message}`)
                reject(err)
            } else {
                const end = Date.now()
                resolve(`Execution time: ${end - start} ms`)
            }
        }).on('data', row => {
            if (phoneRegex.test(row[5]) && emailRegex.test(row[6])) {
                const uniqueKey = `${row[5]}-${row[6]}`
                if (!uniqueRows.has(uniqueKey)) {
                    uniqueRows.add(uniqueKey)
                    validRowCount++
                    validFileStream.write(row.join(',') + '\n', 'utf-8')
                    if (validRowCount >= batchSize) {
                        validFileStream.end()
                        validFileCount++
                        validRowCount = 0
                        validFileStream = createWriteStream(
                            `${outputPath}valid_customers_${validFileCount}.csv`
                        )
                    }
                }
            } else {
                invalidFileStream.write(row.join(',') + '\n', 'utf-8')
            }
        })
    })

    const end = Date.now()
    app.log.info(`Execution time: ${end - start} ms`)
    return await action
}

module.exports = { parseCustomersToDB, exportTabletoCSV }
