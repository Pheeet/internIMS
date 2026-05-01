const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://internms_user:password123@localhost:5433/internms_db"
});

async function main() {
  await client.connect();
  const res = await client.query('SELECT remarks, status FROM "Internship" ORDER BY "updatedAt" DESC LIMIT 1');
  console.log("REMARKS:", res.rows[0]?.remarks);
  console.log("STATUS:", res.rows[0]?.status);
  await client.end();
}
main().catch(console.error);
