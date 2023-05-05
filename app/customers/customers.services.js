/* eslint-disable prefer-regex-literals */
/* eslint-disable quotes, no-console */
const { parse } = require('csv-parse')
const { createReadStream } = require('fs')
const { join } = require('node:path')

console.log('hello')

// approach 1: load it using node.js streams and process
// approach 2: load it in sql, LOAD Data
// approach 3: create seeder files, write stream

/**
 * * parse csv, create users
 */
const createUser = async (app, props) => {
    const start = Date.now()
    const fileName = '1K-test.txt'
    // const fileName = '1M-customers.txt'
    const filePath = join(__dirname, '..', '..', 'data', fileName)

    app.log.info({ filePath }, 'filePath here: ')

    // const action = await app.knex.raw(
    //     "LOAD DATA INFILE ? INTO TABLE ? FIELDS TERMINATED BY ',' LINES TERMINATED BY '\n'",
    //     [filePath, 'customers']
    // )
    // await app.knex.raw('SET GLOBAL local_infile = true;')
    // const action = await app.knex.raw({
    //     sql: `LOAD DATA LOCAL INFILE '${filePath}'
    //         INTO TABLE customers
    //         FIELDS TERMINATED BY ','
    //         LINES TERMINATED BY '\n'
    //         ( @first_name,
    //         @last_name,
    //         @city,
    //         @state,
    //         @postal_code,
    //         @contact_number,
    //         @email,
    //         @ip_address
    //         )
    //         SET
    //         first_name= @first_name,
    //         last_name = @last_name,
    //         city = @city,
    //         state = @state,
    //         postal_code = @postal_code,
    //         contact_number = @contact_number,
    //         email = @email,
    //         ip_address = @ip_address`,
    //     infileStreamFactory: path => createReadStream(path)
    // })

    const mailValidator = new RegExp('[a-z0-9]+@[a-z]+.[a-z]{2,3}')
    const phoneValidator =
        /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/gm

    const action = trx => {
        return new Promise((resolve, reject) => {
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
                    // app.log.info({ row }, 'row here: ')
                    if (
                        mailValidator.test(row.email) &&
                        phoneValidator.test(row.contact_number)
                    ) {
                        await app
                            .knex('customers')
                            .insert(row)
                            .onConflict('email')
                            .ignore()
                    } else {
                        await app.knex('invalid_customers').insert(row)
                    }
                })
                .on('end', function () {
                    app.log.info('Process Completed.')
                    return null
                })
                .on('error', function (error) {
                    app.log.error({ error }, `${error.message}`)
                })
        })
    }

    await action()

    const end = Date.now()
    return `Execution time: ${end - start} ms`
}

module.exports = { createUser }
