const { Client } = require('pg');

async function test(connectionString, name) {
  console.log(`\nTesting: ${name}`);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`[${name}] ✅ Authentication succeeded`);
    await client.query('SELECT 1');
    console.log(`[${name}] ✅ SELECT 1 succeeded`);
    
    // Test count
    const res = await client.query('SELECT COUNT(*) FROM analyses');
    console.log(`[${name}] ✅ COUNT(*) FROM analyses: ${res.rows[0].count}`);
  } catch (error) {
    console.error(`[${name}] ❌ FAILED: ${error.message}`);
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  await test('postgresql://postgres.uizrytwhgvvwhrdwwyyh:6%40cu8fvQBG89Kp9@east-2.pooler.supabase.com:6543/postgres', 'Original Pooler (Fixed @)');
  await test('postgresql://postgres:6%40cu8fvQBG89Kp9@db.ewawpkkrcmasbqztcvbu.supabase.co:5432/postgres', 'Original Direct (Fixed @)');
  await test('postgresql://postgres:6%40cu8fvQBG89Kp9@db.uizrytwhgvvwhrdwwyyh.supabase.co:5432/postgres', 'Guessed Direct for project uizrytwhgvvwhrdwwyyh');
}

main();
