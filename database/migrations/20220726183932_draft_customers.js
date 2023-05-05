/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async knex => {
    await knex.schema.createTable('draft_customers', table => {
        table.increments('id')
        table.string('first_name')
        table.string('last_name')
        table.string('city')
        table.string('state')
        table.string('postal_code')
        table.string('contact_number')
        table.string('email')
        table.string('ip_address')
        table.timestamps(true, true)
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async knex => {
    await knex.schema.dropTableIfExists('draft_customers')
}
