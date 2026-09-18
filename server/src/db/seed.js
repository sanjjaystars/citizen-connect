const { initDb, query, getDatabaseEngine } = require('./db');

async function seed() {
  await initDb();
  console.log('Seeding database in', getDatabaseEngine(), 'mode...');

  // Check if data already exists
  const existingMuni = await query('SELECT count(*) as count FROM municipalities');
  if (parseInt(existingMuni.rows[0].count, 10) > 0) {
    console.log('Database already has seeded municipalities. Skipping re-seed.');
    return;
  }

  // 1. Municipalities
  await query(`
    INSERT INTO municipalities (id, name, district, state) VALUES
    (1, 'Greater Chennai Corporation', 'Chennai', 'Tamil Nadu'),
    (2, 'Coimbatore City Municipal Corporation', 'Coimbatore', 'Tamil Nadu');
  `);

  // 2. Wards
  await query(`
    INSERT INTO wards (id, municipality_id, name) VALUES
    (1, 1, 'Ward 104 - Anna Nagar West'),
    (2, 1, 'Ward 117 - T. Nagar'),
    (3, 1, 'Ward 173 - Adyar'),
    (4, 2, 'Ward 23 - R.S. Puram'),
    (5, 2, 'Ward 35 - Gandhipuram'),
    (6, 2, 'Ward 58 - Peelamedu');
  `);

  // 3. Departments
  await query(`
    INSERT INTO departments (id, name, municipality_id) VALUES
    (1, 'Roads & Bridges Department', 1),
    (2, 'Solid Waste Management (Garbage)', 1),
    (3, 'Chennai Metro Water Supply & Sewerage Board', 1),
    (4, 'Electricity & Street Lighting Wing', 1),
    (5, 'Storm Water Drain & Flood Control', 1),
    (6, 'Roads & Public Works Department', 2),
    (7, 'Solid Waste Management (Health Wing)', 2),
    (8, 'TWAD Water Supply Department', 2),
    (9, 'Electrical & Street Light Section', 2),
    (10, 'Underground Drainage Division', 2);
  `);

  // 4. Users (Officials & Demo Accounts)
  await query(`
    INSERT INTO users (id, phone, name, role, municipality_id, ward_id) VALUES
    (1, '9999999999', 'Karthikeyan S.', 'citizen', 1, 1),
    (2, '9888888888', 'Priya Raman', 'citizen', 1, 2),
    (3, '9777777777', 'Ananya Swaminathan', 'citizen', 2, 4),
    (4, '9876543210', 'Rajesh Kumar (Zonal Officer)', 'official', 1, NULL),
    (5, '9876543211', 'Meena Sundaram (Commissioner Officer)', 'official', 2, NULL)
    ON CONFLICT (phone) DO NOTHING;
  `);

  console.log('Seeding administrative boundaries completed successfully (clean slate for real uploads)!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
