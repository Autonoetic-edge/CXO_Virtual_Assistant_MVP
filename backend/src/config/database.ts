import pgPromise from 'pg-promise';
import config from './index';

// Initialize pg-promise
const pgp = pgPromise({
  // Initialization options
  capSQL: true,
});

// Database connection
const db = pgp(config.database.url);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Close database connection
export async function closeConnection(): Promise<void> {
  pgp.end();
  console.log('Database connection closed');
}

export { db, pgp };
