/**
 * * approach 1: utilize ReadStream and piping, chunk it all, store it.
 * * approach 2: load it in sql, LOAD DATA command in draft, postprocess it
 * - went with approach 1 for security concerns
 */
const { parse } = require('csv-parse')
const { createReadStream, createWriteStream } = require('fs')
const { join } = require('node:path')

// covers phone cases given in instruction set, valid US number
const phoneRegex = /^1?\s?(\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * * parse csv, insert into DB
 * ! 87 seconds - no filter
 * ! 93 seconds - with filter
 * ! 94 seconds - with filter and export csv
 */
const parseCustomersToDB = async (app, fileName) => {
    const start = Date.now()
    // normalizing path flow as unix and windows have different
    const filePath = join(__dirname, '..', '..', 'data', fileName)
    const outputPath = join(__dirname, '..', '..', 'data', 'output', './')
    app.log.info({ filePath, outputPath }, 'data here: ')

    // vars for sequential file export
    const batchExportSize = 100000
    let validRowCount = 0
    let validFileCount = 1

    // vars for sql insertion
    const batchSize = 25000
    const batchValid = []
    const batchInvalid = []

    // primary parser, creating stream, formatting data,
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

    // WriteStreams for valid-invalid data
    let validFileStream = createWriteStream(
        `${outputPath}valid_customers_${validFileCount}.csv`
    )
    const invalidFileStream = createWriteStream(
        `${outputPath}invalid_customers.csv`
    )
    // to identify duplicate entries
    const uniqueRows = new Set()

    // promisifying stream so that we can wait for it as it completes
    const action = new Promise((resolve, reject) => {
        csvStream
            .on('error', function (error) {
                app.log.error({ error }, `${error.message}`)
                reject(error)
            })
            .on('data', async function (row) {
                // check phone and email. then check duplicate entry
                // mentioned in instruction to use phone and email both
                if (
                    phoneRegex.test(row.contact_number) &&
                    emailRegex.test(row.email)
                ) {
                    const uniqueKey = `${row.contact_number}-${row.email}`
                    if (!uniqueRows.has(uniqueKey)) {
                        uniqueRows.add(uniqueKey)
                        // for batch insert
                        batchValid.push(row)

                        // file writing - checking row count, stopping and creating new when 100k+
                        // only for valid, as all invalid data is in 1 file
                        validRowCount++
                        validFileStream.write(
                            `${row.id},${row.first_name},${row.last_name},${row.city},${row.state},${row.postal_code},${row.contact_number},${row.email},${row.ip_address}\n`
                        )
                        if (validRowCount >= batchExportSize) {
                            validFileStream.end()
                            validFileCount++
                            validRowCount = 0
                            validFileStream = createWriteStream(
                                `${outputPath}valid_customers_${validFileCount}.csv`
                            )
                        }
                    } else {
                        // for batch insert
                        batchInvalid.push(row)
                        // file writing
                        invalidFileStream.write(
                            `${row.id},${row.first_name},${row.last_name},${row.city},${row.state},${row.postal_code},${row.contact_number},${row.email},${row.ip_address}\n`
                        )
                    }
                } else {
                    // for batch insert
                    batchInvalid.push(row)
                    // file writing
                    invalidFileStream.write(
                        `${row.id},${row.first_name},${row.last_name},${row.city},${row.state},${row.postal_code},${row.contact_number},${row.email},${row.ip_address}\n`
                    )
                }

                // pausing stream while doing batchInsert transaction
                // otherwise memory will leak and cause crash
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
                // inserting remaining rows
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

                // closing FileStream to prevent memory leaks
                validFileStream.end()
                invalidFileStream.end()
                const end = Date.now()
                resolve(`Execution time: ${end - start} ms`)
            })
    })

    return await action
}

module.exports = { parseCustomersToDB }
