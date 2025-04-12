const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Web3} = require('web3');
const path = require('path');
const pool = require('./db');
const app = express();

require('dotenv').config();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS view engine and static files folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Ethereum using an HTTP provider as fallback.
const provider = Web3.givenProvider || new Web3.providers.HttpProvider("http://localhost:7545");
const web3 = new Web3(provider);

//Load smart contract artifacts (uncomment and adjust paths if deployed)
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

//-------------------------------------------------------------------------------------------------

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

/* ------------------- API endpoints -------------------- */

// Default page
app.get('/', (req, res) => {
  res.render('login', { title: 'Login' });
});

//Default page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Registration page
app.get('/register', (req, res) => {
  res.render('register', { title: 'User Registration' });
});

// Dashboard page
app.get('/dashboard', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    // Retrieve user details
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    const user = userResult.rows[0];

    // Retrieve registered courses for the user
    const coursesResult = await pool.query(
      'SELECT r.course_id, c.course_name FROM registrations r JOIN courses c ON r.course_id = c.course_id WHERE r.user_id = $1',
      [user_id]
    );
    const courses = coursesResult.rows;

    // Render dashboard view with user and courses
    res.render('dashboard', { user, courses });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send(error.message);
  }
});

// Course Registration page – shows dropdown of available courses
app.get('/course', async (req, res) => {
  try {
    // Assume user_id is provided as a query parameter.
    const user_id = req.query.user_id;
    
    // Fetch the user details from the database.
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found.");
    }
    const user = userResult.rows[0];
    
    // Retrieve all courses from the courses table.
    const coursesResult = await pool.query('SELECT * FROM courses');
    const courses = coursesResult.rows;
    
    // Now render the course page passing both "user" and "courses" objects.
    res.render('course', { user, courses });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    res.status(500).send("Error retrieving courses: " + error.message);
  }
});

app.get('/certificate', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    // Retrieve user details.
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    const user = userResult.rows[0];
    
    // Retrieve all course registrations for the user (with course details and grade).
    const regResult = await pool.query(
      `SELECT r.registration_id, r.course_id, r.grade, c.course_name, c.end_date
       FROM registrations r 
       JOIN courses c ON r.course_id = c.course_id 
       WHERE r.user_id = $1`,
      [user_id]
    );
    const registrations = regResult.rows;
    
    res.render('certificate', { user, registrations });
  } catch (error) {
    console.error("Error retrieving certificates page:", error);
    res.status(500).send("Error retrieving certificates page: " + error.message);
  }
});

// Certificate Download/Issuance Endpoint
app.get('/api/certificate/download', async (req, res) => {
  try {
    const { user_id, registration_id } = req.query;
    
    // Retrieve the registration record joined with course details.
    const regResult = await pool.query(
      `SELECT r.registration_id, r.course_id, r.grade, c.course_name, c.end_date, u.wallet_address
       FROM registrations r
       JOIN courses c ON r.course_id = c.course_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.registration_id = $1 AND r.user_id = $2`,
      [registration_id, user_id]
    );
    
    if (regResult.rows.length === 0) {
      return res.status(404).send("Registration not found.");
    }
    const registration = regResult.rows[0];
    
    // Check eligibility: current date must be past end_date and grade > 4.
    const currentDate = new Date();
    const courseEndDate = new Date(registration.end_date);
    if (currentDate < courseEndDate || registration.grade <= 4) {
      return res.status(400).send("Not eligible for certificate.");
    }
    
    // Generate tokenURI for the certificate NFT metadata.
    // This should be an endpoint returning certificate details.
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/certificates/${user_id}-${registration.course_id}.json`;
    
    // Retrieve blockchain accounts.
    const accounts = await web3.eth.getAccounts();
    
    // Issue the certificate NFT using the student's wallet address.
    // Note: In a fully decentralized system, the student should send this transaction from their wallet.
    // For our example, we use the central account.
    const nftReceipt = await certificateContract.methods.issueCertificate(registration.wallet_address, tokenURI)
      .send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    // Get the certificate NFT token id from the event log.
    const certificateTokenId = nftReceipt.events.CertificateIssued.returnValues.tokenId;
    
    // Insert/update the certificate record in the database.
    const certResult = await pool.query(
      'INSERT INTO certificates (user_id, course_id, nft_certificate_uri) VALUES ($1, $2, $3) RETURNING *',
      [user_id, registration.course_id, tokenURI]
    );
    const certificateRecord = certResult.rows[0];
    
    // Optionally, generate a certificate text to download.
    const certificateText = 
`Certificate of Completion
---------------------------
This certifies that the student has successfully completed the course:
${registration.course_name}
Grade Achieved: ${registration.grade}
Course End Date: ${registration.end_date}

Certificate NFT Token ID: ${certificateTokenId}

Issued on: ${new Date().toLocaleDateString()}
Congratulations!`;
    
    // Set headers and send the certificate text as a downloadable file.
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.send(certificateText);
    
  } catch (error) {
    console.error("Certificate issuance/download error:", error);
    res.status(500).send("Error generating certificate: " + error.message);
  }
});

app.get('/fees', async (req, res) => {
  try {
    // Assume that the user_id is provided as a query parameter, e.g., /fees?user_id=2
    const user_id = req.query.user_id;
    
    // Retrieve the user details (if needed for display)
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found.");
    }
    const user = userResult.rows[0];
    
    // Retrieve the active semester: current date must be between start_date and end_date.
    const semesterResult = await pool.query(
      `SELECT * FROM Semester
       WHERE CURRENT_DATE BETWEEN start_date AND end_date`
    );
    
    let semester = null;
    if (semesterResult.rows.length > 0) {
      semester = semesterResult.rows[0];
    }
    
    // Render the fee payment page (fee.ejs) with the user and semester details.
    res.render('fee', { user, semester });
  } catch (error) {
    console.error("Error retrieving fee details:", error);
    res.status(500).send("Error retrieving fee details: " + error.message);
  }
});

/*--------------------------------------------------------------------*/

// User Registration – store user and mint identity NFT
app.post('/api/register', async (req, res) => {
  try {
    const { roll_number, name, email, password, dob } = req.body;
    
    // Generate a new Ethereum account (wallet) for the user.
    const newAccount = web3.eth.accounts.create();
    const wallet_address = newAccount.address;
    const privateKey = newAccount.privateKey;  // Stored as plain text for demonstration.
    
    // Insert user details into the database, including wallet_address and private_key.
    const result = await pool.query(
      `INSERT INTO users (roll_number, name, email, password, dob, wallet_address, private_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [roll_number, name, email, password, dob, wallet_address, privateKey]
    );
    const newUser = result.rows[0];
    
    // Generate tokenURI for the digital identity NFT.
    // This should point to your metadata endpoint which returns user metadata.
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/metadata/identity/${newUser.user_id}`;
    
    // Retrieve available blockchain accounts (using a central account for NFT minting).
    const accounts = await web3.eth.getAccounts();
    
    // Mint the NFT using the central account; the NFT is minted to msg.sender (which is accounts[0]).
    const receipt = await identityContract.methods.mintNFT(tokenURI).send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    // Extract the NFT token ID from the event log.
    const tokenId = receipt.events.IdentityMinted.returnValues.tokenId;
    console.log("TokenID: ", tokenId);
    
    // Update the user record with the NFT token id.
    await pool.query(
      'UPDATE users SET identity_token = $1 WHERE user_id = $2',
      [tokenId, newUser.user_id]
    );
    
    // Render the registration success page with wallet details.
    res.render('register-success', {
      user: newUser,
      receipt,
      wallet: { 
        address: wallet_address, 
        privateKey: privateKey
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login – Authentication
app.post('/api/login', async (req, res) => {
  try {
    const { roll_number, private_key } = req.body;
    
    // Retrieve the user record from the database using the roll number.
    const result = await pool.query('SELECT * FROM users WHERE roll_number = $1', [roll_number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    const user = result.rows[0];
    
    // Compare the provided private key with the stored private key.
    if (user.private_key !== private_key) {
      return res.status(400).json({ success: false, error: "Invalid private key." });
    }
    
    // If credentials are valid, redirect to the dashboard.
    res.redirect('/dashboard?user_id=' + user.user_id);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Course Registration
app.post('/api/course/register', async (req, res) => {
  try {
    const { user_id, course_id } = req.body;
    
    // Retrieve the user record by user_id.
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    
    // Get the NFT token id representing the user's digital identity.
    const identityToken = web3.utils.toBigInt(user.identity_token);
    if (identityToken === null || identityToken === undefined) {
      return res.status(400).json({ success: false, error: 'User does not have a digital identity NFT.' });
    }
    
    // Check if the user has already registered for this course.
    const existingRegistration = await pool.query(
      'SELECT * FROM registrations WHERE user_id = $1 AND course_id = $2',
      [user_id, course_id]
    );
    if (existingRegistration.rowCount > 0) {
      return res.status(400).json({ success: false, error: 'Course already registered' });
    }
    
    // Insert the course registration record into the database.
    const registrationResult = await pool.query(
      'INSERT INTO registrations (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [user_id, course_id]
    );
    const registration = registrationResult.rows[0];
    
    // Record the course registration on-chain using the NFT token id.
    // The contract function (registerCourse) expects the NFT token id (as identity)
    // and a course id. It will verify that msg.sender owns the NFT.
    // For demonstration, we use accounts[0] as the sender.
    const accounts = await web3.eth.getAccounts();
    const receipt = await courseContract.methods.registerCourse(identityToken, course_id).send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    res.status(200).json({ success: true, registration});
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
    const { user_id, amount } = req.body;
    
    // Retrieve user details (if needed).
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    
    // Generate tokenURI for the fee receipt metadata.
    // For example, it could be an endpoint that returns fee payment details.
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/fees/metadata/${user_id}-${Date.now()}.json`;
    
    // Retrieve blockchain accounts (using a central account for fee processing if required).
    const accounts = await web3.eth.getAccounts();
    
    // Call the fee payment function in the FeePaymentNFT contract.
    const receipt = await feeContract.methods.payFees(tokenURI).send({
      from: accounts[0],
      value: web3.utils.toWei(amount, 'ether'),
      gas: 6721975,
      gasPrice: '20000000000'
    });
    
    // Optionally, insert a record into a transactions table in your database.
    const dbResult = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, transaction_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, 'fee_payment', amount, receipt.transactionHash]
    );
    const transactionRecord = dbResult.rows[0];
    
    res.status(200).json({ success: true, transaction: transactionRecord });
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
