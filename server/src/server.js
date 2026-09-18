const app = require('./app');
const { initDb } = require('./db/db');
const { seed } = require('./db/seed');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await initDb();
    await seed();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏛️  Civic Connect API Server running on port ${PORT}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Demo Mock OTP: 123456`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
