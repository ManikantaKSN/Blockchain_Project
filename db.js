// db.js
const { Client, Pool } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'nft_identity';

// Function to check if the database exists; if not, create it.
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

// Create a connection pool to the target database.
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

// Function to create necessary tables
async function createTables() {
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
        password VARCHAR(100) NOT NULL,
        dob DATE,
        wallet_address VARCHAR(42),
        private_key TEXT,
        identity_token INTEGER,
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

    //Course instructor
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_instructor (
        fac_id INTEGER,
        course_id INTEGER,
        PRIMARY KEY (fac_id, course_id),
        FOREIGN KEY (fac_id) REFERENCES faculty(fac_id),
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
      );
    `);
    
    // Registrations table.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        registration_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        course_id INTEGER REFERENCES courses(course_id),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        grade INTEGER DEFAULT 0 CHECK (grade >= 0 AND grade <= 10)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fees_paid (
        semester_no INTEGER,
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS Semester (
        semester_no SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        fees NUMERIC(10,4) NOT NULL,
        CHECK (fees >= 0)
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
    
    console.log("All tables created or already exist.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// Function to insert dummy courses if not already present.
async function insertDummyCourses() {
  try {
    // Check if there are already courses.
    const result = await pool.query(`SELECT COUNT(*) FROM courses`);
    const count = parseInt(result.rows[0].count);
    if (count === 0) {
      const dummyCourses = [
        { course_name: "Introduction to Blockchain", description: "Basics of blockchain technology", end_date: "2023-05-30" },
        { course_name: "Smart Contract Development", description: "Developing smart contracts using Solidity", end_date: "2023-06-15" },
        { course_name: "Decentralized Applications", description: "Building dApps on Ethereum", end_date: "2023-06-30" },
        { course_name: "Cryptography Fundamentals", description: "Understanding cryptography in blockchain", end_date: "2023-05-20" },
        { course_name: "Ethereum Development", description: "Developing on the Ethereum platform", end_date: "2023-07-01" },
        { course_name: "Tokenomics", description: "Study of token economics", end_date: "2023-06-10" },
        { course_name: "Blockchain Security", description: "Security aspects of blockchain technology", end_date: "2023-06-25" },
        { course_name: "Decentralized Finance", description: "Introduction to DeFi", end_date: "2023-07-05" },
        { course_name: "Digital Identity", description: "Using blockchain for digital identity", end_date: "2023-05-15" },
        { course_name: "Supply Chain on Blockchain", description: "Implementing blockchain in supply chains", end_date: "2023-06-05" },
      ];

      for (let course of dummyCourses) {
        await pool.query(
          `INSERT INTO courses (course_name, description, end_date) VALUES ($1, $2, $3)`,
          [course.course_name, course.description, course.end_date]
        );
      }
      console.log("Dummy courses inserted.");
    } else {
      console.log("Courses already exist, skipping dummy insertion.");
    }
  } catch (error) {
    console.error("Error inserting dummy courses:", error);
  }
}

// Run asynchronous setup: create database, tables, and insert dummy courses.
(async () => {
  try {
    await createDatabaseIfNotExists();
    await createTables();
    await insertDummyCourses();
  } catch (err) {
    console.error("Error setting up the database:", err);
  }
})();

module.exports = pool;
