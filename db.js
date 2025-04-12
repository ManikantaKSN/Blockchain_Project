const { Client, Pool } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'nft_identity';

async function createDatabaseIfNotExists() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to the default database
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });
  
  await client.connect();
  
  const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database "${dbName}" created successfully.`);
  } else {
    console.log(`Database "${dbName}" already exists.`);
  }
  
  await client.end();
}

function createPool() {
  return new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: dbName,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });
}

const pool = createPool();

async function createTables() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        roll_number VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        dob DATE,
        wallet_address VARCHAR(42),
        private_key TEXT,
        identity_token INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // faculty table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        fac_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        dob DATE,
        wallet_address VARCHAR(42),
        private_key TEXT,
        identity_token INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Semester table.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Semester (
        semester_no SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        fees NUMERIC(10,4) NOT NULL,
        CHECK (fees >= 0)
      );
    `);
    
    // Courses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        course_id SERIAL PRIMARY KEY,
        course_name VARCHAR(100) NOT NULL,
        credits INTEGER NOT NULL CHECK (credits > 0),
        fac_id INTEGER REFERENCES faculty(fac_id),
        semester_no INTEGER REFERENCES Semester(semester_no),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL
      );
    `);
    
    // Registrations table.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        registration_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        course_id INTEGER REFERENCES courses(course_id),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade INTEGER DEFAULT 0 CHECK (grade >= 0 AND grade <= 10)
      );
    `);

    // Fees
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fees_paid (
        semester_no INTEGER REFERENCES Semester(semester_no),
        user_id INTEGER,
        fees_paid BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (semester_no, user_id)
      );
    `);  
    
    // Certificates table.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        certificate_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        course_id INTEGER REFERENCES courses(course_id),
        nft_certificate_uri TEXT,
        issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Transactions table.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        type VARCHAR(50),
        amount DECIMAL,
        transaction_hash VARCHAR(100),
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert sample data into the Semester table
    await pool.query(`
      INSERT INTO Semester (semester_no, start_date, end_date, fees)
      VALUES
        (1, '2022-01-01', '2022-04-30', 0.02),
        (2, '2022-06-01', '2022-10-31', 0.04),
        (3, '2023-01-01', '2023-04-30', 0.06),
        (4, '2023-06-01', '2023-10-31', 0.08),
        (5, '2024-01-01', '2024-04-30', 0.10),
        (6, '2024-06-01', '2024-10-31', 0.12),
        (7, '2025-01-01', '2025-04-30', 0.14),
        (8, '2025-06-01', '2025-10-31', 0.16)
      ON CONFLICT (semester_no) DO NOTHING;
    `);
    
    console.log("All tables created or already exist.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// Create database and tables
(async () => {
  try {
    await createDatabaseIfNotExists();
    await createTables();
  } catch (err) {
    console.error("Error setting up the database:", err);
  }
})();

module.exports = pool;
