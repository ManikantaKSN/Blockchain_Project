/**
 * index.js
 *
 * Hybrid dApp: Express server with EJS views, PostgreSQL storage, and blockchain integration.
 * Implements:
 * 1. Login/Register flow.
 * 2. Dashboard with options: Course Registration, Certificate Issuance, Fee Payment.
 *    Also shows the list of courses registered by the user.
 * 3. Course Registration page: a dropdown of courses and a popup (simple hidden div) for course details and registration.
 * 4. Certificate Issuance: For courses with end_date in the past, a button to generate certificate.
 * 5. Fee Payment: A page showing user details and fee amount.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Web3} = require('web3'); // Use require('web3') – Web3 is a constructor.
const path = require('path');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS view engine and static files folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Ethereum using an HTTP provider as fallback.
const provider = Web3.givenProvider || new Web3.providers.HttpProvider("http://localhost:8545");
const web3 = new Web3(provider);

// Load smart contract artifacts (uncomment and adjust paths if deployed)
const identityArtifact = require('./build/contracts/MyNFT.json');
const courseArtifact = require('./build/contracts/MyCourseReg.json');
const certificateArtifact = require('./build/contracts/CertificateNFT.json');
const feeArtifact = require('./build/contracts/FeePaymentNFT.json');

const identityNetworkId = Object.keys(identityArtifact.networks)[0];
const identityAddress = identityArtifact.networks[identityNetworkId].address;
const identityContract = new web3.eth.Contract(identityArtifact.abi, identityAddress);

const courseNetworkId = Object.keys(courseArtifact.networks)[0];
const courseAddress = courseArtifact.networks[courseNetworkId].address;
const courseContract = new web3.eth.Contract(courseArtifact.abi, courseAddress);

const certificateNetworkId = Object.keys(certificateArtifact.networks)[0];
const certificateAddress = certificateArtifact.networks[certificateNetworkId].address;
const certificateContract = new web3.eth.Contract(certificateArtifact.abi, certificateAddress);

const feeNetworkId = Object.keys(feeArtifact.networks)[0];
const feeAddress = feeArtifact.networks[feeNetworkId].address;
const feeContract = new web3.eth.Contract(feeArtifact.abi, feeAddress);

/* ----- Metadata Endpoint ----- */
// This endpoint returns JSON metadata for a user's digital identity NFT.
app.get('/api/metadata/identity/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query('SELECT name, dob, roll_number FROM users WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const metadata = {
      name: user.name,
      description: `Digital identity for ${user.name}.`,
      attributes: [
        { trait_type: "Roll Number", value: user.roll_number },
        { trait_type: "Date of Birth", value: user.dob }
      ]
    };
    res.json(metadata);
  } catch (error) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ----- Render Pages ----- */

// Login page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register', { title: 'User Registration' });
});

// Dashboard: Simulate a logged-in user (user_id passed as query parameter)
app.get('/dashboard', async (req, res) => {
  const user_id = req.query.user_id;
  let courses = [];
  if (user_id) {
    const result = await pool.query('SELECT r.course_id, c.course_name FROM registrations r JOIN courses c ON r.course_id = c.course_id WHERE r.user_id = $1', [user_id]);
    courses = result.rows;
  }
  res.render('dashboard', { title: 'Dashboard', user_id, courses });
});

// Course Registration page – shows dropdown of available courses
app.get('/course', async (req, res) => {
  const result = await pool.query('SELECT * FROM courses');
  const courses = result.rows;
  res.render('course', { title: 'Course Registration', courses });
});

// Certificate Issuance page – shows courses eligible for certificate issuance
app.get('/certificate', async (req, res) => {
  const user_id = req.query.user_id;
  const result = await pool.query(`
    SELECT r.course_id, c.course_name, c.end_date 
    FROM registrations r 
    JOIN courses c ON r.course_id = c.course_id 
    WHERE r.user_id = $1
  `, [user_id]);
  const courses = result.rows;
  res.render('certificate', { title: 'Certificate Issuance', user_id, courses, currentDate: new Date() });
});

// Fee Payment page – shows user details and fee amount (fixed for demo)
app.get('/fees', async (req, res) => {
  const user_id = req.query.user_id;
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
  const user = result.rows[0];
  const feeAmount = 0.05; // fixed fee amount (in ETH) for demonstration
  res.render('fee', { title: 'Semester Fee Payment', user, feeAmount });
});

/* ----- API Endpoints ----- */

// API: User Registration – store user and mint identity NFT
app.post('/api/register', async (req, res) => {
  try {
    const { roll_number, name, email, password, dob } = req.body;
    const result = await pool.query(
      'INSERT INTO users (roll_number, name, email, password, dob) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [roll_number, name, email, password, dob]
    );
    const newUser = result.rows[0];
    // Instead of a placeholder, point to our metadata endpoint:
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/metadata/identity/${newUser.user_id}`;
    const accounts = await web3.eth.getAccounts();
    const receipt = await identityContract.methods.mintNFT(email, tokenURI).send({ from: accounts[0] });
    res.status(200).json({ success: true, user: newUser, receipt });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Login – simple authentication
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email=$1 AND password=$2', [email, password]);
    if (result.rows.length > 0) {
      res.redirect('/dashboard?user_id=' + result.rows[0].user_id);
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send(error.message);
  }
});

// API: Course Registration – invoked from course page popup
app.post('/api/course', async (req, res) => {
  try {
    const { user_id, course_id, wallet_address } = req.body;
    const result = await pool.query(
      'INSERT INTO registrations (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [user_id, course_id]
    );
    const registration = result.rows[0];
    const accounts = await web3.eth.getAccounts();
    const receipt = await courseContract.methods.registerCourse(wallet_address, course_id).send({ from: accounts[0] });
    res.status(200).json({ success: true, registration, receipt });
  } catch (error) {
    console.error("Course registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Certificate Issuance – if course end_date has passed
app.post('/api/certificate', async (req, res) => {
  try {
    const { studentAddress, user_id, course_id } = req.body;
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/certificates/${user_id}-${course_id}.json`;
    const accounts = await web3.eth.getAccounts();
    const receipt = await certificateContract.methods.issueCertificate(studentAddress, tokenURI).send({ from: accounts[0] });
    const result = await pool.query(
      'INSERT INTO certificates (user_id, course_id, nft_certificate_uri) VALUES ($1, $2, $3) RETURNING *',
      [user_id, course_id, tokenURI]
    );
    const certificateRecord = result.rows[0];
    res.status(200).json({ success: true, certificate: certificateRecord, receipt });
  } catch (error) {
    console.error("Certificate issuance error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Fee Payment – process fee payment and mint NFT receipt
app.post('/api/fees', async (req, res) => {
  try {
    const { user_id, wallet_address, amount, details } = req.body;
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/fees/metadata/${user_id}-${Date.now()}.json`;
    const accounts = await web3.eth.getAccounts();
    const receipt = await feeContract.methods.payFees(tokenURI).send({
      from: accounts[0],
      value: web3.utils.toWei(amount, 'ether')
    });
    const result = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, transaction_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, 'fee_payment', amount, receipt.transactionHash]
    );
    const transactionRecord = result.rows[0];
    res.status(200).json({ success: true, transaction: transactionRecord, receipt });
  } catch (error) {
    console.error("Fee payment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Catch-all error route
app.use((req, res) => {
  res.status(404).render('error', { title: '404 - Not Found', message: 'Page not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
