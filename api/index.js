const app = require('../server/src/app');
const { initDb } = require('../server/src/db/db');
const { seed } = require('../server/src/db/seed');

let isInitialized = false;

module.exports = async (req, res) => {
  if (!isInitialized) {
    try {
      await initDb();
      await seed();
      isInitialized = true;
    } catch (err) {
      console.error('Vercel serverless init error:', err);
    }
  }
  return app(req, res);
};
