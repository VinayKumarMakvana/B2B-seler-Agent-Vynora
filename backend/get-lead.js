const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://vynora:vynora_secret@localhost:5432/vynora' });
client.connect().then(() => client.query('SELECT id FROM leads LIMIT 1')).then(res => { console.log(res.rows[0].id); process.exit(0); });
