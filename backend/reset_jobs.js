const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://vynora:vynora_secret@localhost:5432/vynora' });
client.connect().then(() => {
  return client.query("UPDATE jobs SET status = 'pending' WHERE status = 'running'");
}).then(() => {
  console.log('Jobs reset');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
