
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'your_db_password',
    database: 'happy_farm'
};

const client = new Client(config);

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        const sqlPath = path.join(__dirname, '../schema/admin_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Creating tables...');
        await client.query(sql);
        console.log('Tables created successfully!');

        console.log('Verifying tables...');
        const tables = [
            'admin_operation_log',
            'system_monitoring',
            'alert_config',
            'alert_record',
            'operation_approval',
            'currency_control_log',
            'currency_release_strategy',
            'data_statistics',
            'currency_balance_monitor',
            'system_notification'
        ];

        for (const table of tables) {
            const result = await client.query(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
                [table]
            );
            if (result.rows[0].exists) {
                console.log(`  OK: ${table}`);
            } else {
                console.log(`  MISSING: ${table}`);
            }
        }

        console.log('Migration completed!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
        console.log('Connection closed');
    }
}

runMigration();

