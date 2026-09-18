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

  // 4. Users (Citizens & Officials)
  await query(`
    INSERT INTO users (id, phone, name, role, municipality_id, ward_id) VALUES
    (1, '9999999999', 'Karthikeyan S.', 'citizen', 1, 1),
    (2, '9888888888', 'Priya Raman', 'citizen', 1, 2),
    (3, '9777777777', 'Ananya Swaminathan', 'citizen', 2, 4),
    (4, '9876543210', 'Rajesh Kumar (Zonal Officer)', 'official', 1, NULL),
    (5, '9876543211', 'Meena Sundaram (Commissioner Officer)', 'official', 2, NULL);
  `);

  // 5. Sample Civic Issues
  // GCC Ward 104 Anna Nagar
  await query(`
    INSERT INTO posts (id, user_id, ward_id, department_id, category, description, cleaned_description, photo_url, lat, lng, severity, status, official_notes, created_at) VALUES
    (
      1, 1, 1, 1, 'Road',
      'Inga 4th Avenue junction la periya pothole irukku. 2 two-wheelers fell yesterday evening due to poor visibility.',
      'Dangerous pothole near 4th Avenue junction causing two-wheeler accidents.',
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      13.0852, 80.2105, 'High', 'Received',
      NULL,
      datetime('now', '-2 days')
    ),
    (
      2, 2, 1, 2, 'Garbage',
      'Commercial garbage dumped openly near 6th Main Road park entrance. Stray cattle and dogs scattering waste all over the footpath.',
      'Open commercial garbage dumping near park entrance attracting stray animals.',
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=60',
      13.0864, 80.2118, 'Medium', 'In Progress',
      'Assigned to Zone 8 Conservancy Inspector. Door-to-door bin monitoring in progress.',
      datetime('now', '-1 days')
    ),
    (
      3, 1, 1, 3, 'Water',
      'Drinking water main pipe joint cracked opposite post office. Clean potable water wasting continuously onto the road for 12 hours.',
      'Clean potable drinking water pipeline leak flooding road near post office.',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=60',
      13.0841, 80.2089, 'High', 'Resolved',
      'Metro Water Area Engineer team replaced gasket and sealed main pipe. Normal water pressure restored.',
      datetime('now', '-4 days')
    ),
    (
      4, 1, 1, 4, 'Electricity',
      'Three consecutive street lights on 3rd Cross Street flickering and dead. Total darkness after 7 PM.',
      'Streetlights malfunctioning on 3rd Cross Street causing darkness at night.',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
      13.0870, 80.2120, 'Low', 'Received',
      NULL,
      datetime('now', '-5 hours')
    ),
    (
      5, 2, 2, 5, 'Drainage',
      'Storm water drain culvert blocked with plastic and silt near Panagal Park. Rainwater starting to stagnate.',
      'Blocked storm water drain causing waterlogging near Panagal Park.',
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=60',
      13.0425, 80.2340, 'Medium', 'In Progress',
      'Desilting machine deployed by Ward 117 engineering team.',
      datetime('now', '-18 hours')
    ),
    (
      6, 3, 4, 6, 'Road',
      'Tar surface eroded completely on DB Road R.S. Puram. Speed breakers are unmarked without reflective paint.',
      'Unmarked speed breakers and eroded tar surface on DB Road.',
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
      11.0092, 76.9532, 'Medium', 'Received',
      NULL,
      datetime('now', '-1 days')
    );
  `);

  // 6. Upvotes
  await query(`
    INSERT INTO upvotes (post_id, user_id) VALUES
    (1, 1), (1, 2), (1, 3),
    (2, 1), (2, 2),
    (3, 1), (3, 2), (3, 3),
    (5, 2),
    (6, 3);
  `);

  console.log('Seeding completed successfully!');
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
