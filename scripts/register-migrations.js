// Registers missing migrations in drizzle.__drizzle_migrations.
// Useful when migrations were applied manually but not recorded.
require('dotenv').config();
const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.POSTGRES_URL);
  const hashes = [
    'C7BAED71023BA1C1A80B9B0FF52058A07214B33C539A1C74917F357EAEA6499D', // 0004_listing_payments.sql
    'E608DE850069960DE55EA329C46F68B88BA0891146E4B327B4CBA75D237BD4A9', // 0005_listing_enums.sql
    '338438CAB300FE98A7320A5DC6DD32A676527B539881DB205494E53B58247231', // 0006_listing_enums_cast.sql
  ];

  try {
    const [{ max_id }] = await sql.unsafe(
      'select coalesce(max(id),0) as max_id from drizzle.__drizzle_migrations'
    );
    let id = Number(max_id);
    for (const hash of hashes) {
      id += 1;
      await sql.unsafe(
        'insert into drizzle.__drizzle_migrations (id, hash, created_at) values ($1, $2, $3) on conflict do nothing',
        [id, hash, Date.now().toString()]
      );
      console.log(`Recorded migration id=${id} hash=${hash}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
