const { parse } = require('csv-parse')
const { createReadStream, createWriteStream } = require('fs')
const { join } = require('node:path')

const exportTabletoCSV = async (app, fileName) => {
    const start = Date.now()
    const filePath = join(__dirname, '..', '..', 'data', fileName)
    const batchValid = []
    const batchInvalid = []
    const csvStream = createReadStream(filePath).pipe(
        parse({
            delimiter: ',',
            from_line: 1
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
            })
            .on('end', async function () {
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
module.exports = { exportTabletoCSV }

// /* eslint-disable quotes, no-console */
// const { join } = require('node:path')
// // const { createReadStream } = require('fs')
// const mysql = require('mysql')

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     database: 'orangetoolz'
// })
// // infileStreamFactory: path => createReadStream(path)

// const createUser = () => {
//     try {
//         const start = Date.now()
//         const fileName = '1M-customers.txt'
//         // const fileName = '1M-customers.txt'
//         const filePath = join(__dirname, '..', '..', 'data', fileName)

//         // app.log.info({ filePath }, 'filePath here: ')

//         connection.query('SET GLOBAL local_infile = true;')

//         connection.query({
//             sql: `LOAD DATA LOCAL INFILE '${fileName}'
//             INTO TABLE customers
//             FIELDS TERMINATED BY ','
//             LINES TERMINATED BY '\r'
//             ( @first_name,
//             @last_name,
//             @city,
//             @state,
//             @postal_code,
//             @contact_number,
//             @email,
//             @ip_address
//             )
//             SET
//             first_name= @first_name,
//             last_name = @last_name,
//             city = @city,
//             state = @state,
//             postal_code = @postal_code,
//             contact_number = @contact_number,
//             email = @email,
//             ip_address = @ip_address`,
//             result: []
//         })

//         // infileStreamFactory: path => createReadStream(path)
//         connection.end()

//         const end = Date.now()
//         console.log(`Execution time: ${end - start} ms`)
//         // console.log('action =>', action)
//     } catch (error) {
//         console.log('error =>', error)
//     }
// }

// createUser()
// // // app.log.info({ row }, 'row here: ')
// // if (
// //     /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(
// //         row.email
// //     ) === true &&
// //     /^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/gm.test(
// //         row.contact_number
// //     ) === true
// // ) {
// //     validCustomers.push(row)
// //     // await app
// //     //     .knex('customers')
// //     //     .insert(row)
// //     //     .onConflict('email')
// //     //     .ignore()
// // } else {
// //     invalidCustomers.push(row)
// //     // await app.knex('invalid_customers').insert(row)
// // }
// // counter++
// // if (counter >= 5000) {
// //     await app
// //         .knex('customers')
// //         .insert(row)
// //         .onConflict('email')
// //         .ignore()
// //     await app.knex('invalid_customers').insert(row)
// //     counter = 0
// // }
