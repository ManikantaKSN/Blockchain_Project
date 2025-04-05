// db.js
const { Client, Pool } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'nft_identity';

// Function to check if the database exists, and create it if not
const createDatabaseIfNotExists = async () => {
  // Connect to the default 'postgres' database
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    // Check if the database exists
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (result.rowCount === 0) {
      // Database does not exist; create it
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error("Error checking or creating database:", error);
  } finally {
    await client.end();
  }
};

const initDatabase = async () => {
  await createDatabaseIfNotExists();

  // Create a connection pool to the target database
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: dbName,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  });

  // Create necessary tables if they don't exist
  const createTables = async () => {
    try {
      // Users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          roll_number VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          dob DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Courses table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS courses (
          course_id SERIAL PRIMARY KEY,
          course_name VARCHAR(100) NOT NULL,
          description TEXT,
          end_date DATE NOT NULL
        );
      `);
      // Registrations table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS registrations (
          registration_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(user_id),
          course_id INTEGER REFERENCES courses(course_id),
          registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Certificates table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS certificates (
          certificate_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(user_id),
          course_id INTEGER REFERENCES courses(course_id),
          nft_certificate_uri TEXT,
          issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Transactions table
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
      console.log("All tables created or already exist.");
    } catch (error) {
      console.error("Error creating tables:", error);
    }
  };

  await createTables();
  return pool;
};

module.exports = initDatabase();
