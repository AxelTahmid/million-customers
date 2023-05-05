/* eslint-disable quotes, no-console */
const { join } = require('node:path')
const { createReadStream } = require('fs')
const mysql = require('mysql2')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'orangetoolz',
    infileStreamFactory: path => createReadStream(path)
})

const createUser = (app, props) => {
    try {
        const fileName = '100test.txt'
        // const fileName = '1M-customers.txt'
        const filePath = join(__dirname, '..', '..', 'data', fileName)

        // app.log.info({ filePath }, 'filePath here: ')

        connection.query('SET GLOBAL local_infile = true;')

        const action = connection.query({
            sql: `LOAD DATA LOCAL INFILE '${filePath}' 
            INTO TABLE customers 
            FIELDS TERMINATED BY ',' 
            LINES TERMINATED BY '\n'  
            ( @first_name, 
            @last_name, 
            @city, 
            @state, 
            @postal_code, 
            @contact_number, 
            @email, 
            @ip_address
            )
            SET 
            first_name= @first_name, 
            last_name = @last_name, 
            city = @city, 
            state = @state, 
            postal_code = @postal_code, 
            contact_number = @contact_number, 
            email = @email, 
            ip_address = @ip_address`,
            values: [],
            infileStreamFactory: path => createReadStream(path)
        })

        console.log('action =>', action)
    } catch (error) {
        console.log('error =>', error)
    }
}

createUser()
