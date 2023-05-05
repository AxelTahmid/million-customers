const { Transform } = require('stream')

class BatchInsertStream extends Transform {
    constructor(knex, tableName, batchSize) {
        super({ objectMode: true })

        this.knex = knex
        this.tableName = tableName
        this.batchSize = batchSize
        this.batch = []
    }

    async _transform(chunk, encoding, callback) {
        this.batch.push(chunk)

        if (this.batch.length >= this.batchSize) {
            try {
                await this.knex.batchInsert(
                    this.tableName,
                    this.batch,
                    this.batchSize
                )
                this.batch.length = 0
                callback()
            } catch (error) {
                callback(error)
            }
        } else {
            callback()
        }
    }

    async _flush(callback) {
        if (this.batch.length > 0) {
            try {
                await this.knex.batchInsert(
                    this.tableName,
                    this.batch,
                    this.batchSize
                )
                this.batch = []
                callback()
            } catch (error) {
                callback(error)
            }
        } else {
            callback()
        }
    }
}

module.exports = BatchInsertStream
