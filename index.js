const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {Web3} = require('web3');
const path = require('path');
const pool = require('./db');
const app = express();

require('dotenv').config();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS view engine and static files folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to Ethereum
const provider = Web3.givenProvider || new Web3.providers.HttpProvider("http://localhost:7545");
const web3 = new Web3(provider);

//Load smart contract artifacts
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

const amenitiesArtifact = require('./build/contracts/AmenitiesNFT.json');
const amenitiesNetworkId = Object.keys(amenitiesArtifact.networks)[0];
const amenitiesAddress = amenitiesArtifact.networks[amenitiesNetworkId].address;
const amenitiesContract = new web3.eth.Contract(amenitiesArtifact.abi, amenitiesAddress);
//-------------------------------------------------------------------------------------------------

/* ----- Metadata Endpoint ----- */
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

// Login page
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
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    const user = userResult.rows[0];

    const coursesResult = await pool.query(
      'SELECT r.course_id, c.course_name FROM registrations r JOIN courses c ON r.course_id = c.course_id WHERE r.user_id = $1',
      [user_id]
    );
    const courses = coursesResult.rows;

    res.render('dashboard', { user, courses });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send(error.message);
  }
});

// Course Registration page
app.get('/course', async (req, res) => {
  try {
    const user_id = req.query.user_id;

    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found.");
    }
    const user = userResult.rows[0];
    
    const coursesResult = await pool.query('SELECT * FROM courses');
    const courses = coursesResult.rows;

    const semesterResult = await pool.query(
      `SELECT * FROM Semester WHERE CURRENT_DATE BETWEEN start_date AND end_date`
    );
    let semester = null;
    if (semesterResult.rows.length > 0) {
      semester = semesterResult.rows[0];
    }
    
    let feePaid = false;
    if (semester) {
      const feeCheckResult = await pool.query(
        'SELECT fees_paid FROM fees_paid WHERE semester_no = $1 AND user_id = $2',
        [semester.semester_no, user_id]
      );
      if (feeCheckResult.rows.length > 0) {
        feePaid = feeCheckResult.rows[0].fees_paid;
      }
    }

    res.render('course', { user, courses, feePaid });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    res.status(500).send("Error retrieving courses: " + error.message);
  }
});

// Certificates page
app.get('/certificate', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    const user = userResult.rows[0];
    
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

// Certificate Download
app.get('/api/certificate/download', async (req, res) => {
  try {
    const { user_id, registration_id } = req.query;
    
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
    
    const currentDate = new Date();
    const courseEndDate = new Date(registration.end_date);
    if (/*currentDate < courseEndDate ||*/ registration.grade <= 4) {
      return res.status(400).send("Not eligible for certificate.");
    }
    
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/certificates/${user_id}-${registration.course_id}.json`;
    
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    
    const identityToken = web3.utils.toBigInt(user.identity_token);
    if (identityToken === null || identityToken === undefined) {
      return res.status(400).json({ success: false, error: 'User does not have a digital identity NFT.' });
    }

    const accounts = await web3.eth.getAccounts();

    const nftReceipt = await certificateContract.methods.issueCertificate(identityToken, registration.wallet_address, tokenURI)
      .send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    const certificateTokenId = nftReceipt.events.CertificateIssued.returnValues.tokenId;
    
    const certResult = await pool.query(
      'INSERT INTO certificates (user_id, course_id, nft_certificate_uri) VALUES ($1, $2, $3) RETURNING *',
      [user_id, registration.course_id, tokenURI]
    );
    const certificateRecord = certResult.rows[0];

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
    
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.send(certificateText);
    
  } catch (error) {
    console.error("Certificate issuance/download error:", error);
    res.status(500).send("Error generating certificate: " + error.message);
  }
});

// Fee Payment page
app.get('/fees', async (req, res) => {
  try {
    const user_id = req.query.user_id;
    
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found.");
    }
    const user = userResult.rows[0];
    
    const semesterResult = await pool.query(
      `SELECT * FROM Semester
       WHERE CURRENT_DATE BETWEEN start_date AND end_date`
    );
    
    let semester = null;
    if (semesterResult.rows.length > 0) {
      semester = semesterResult.rows[0];
    }

    let paid = false;
    if (semester) {
      const feeCheckResult = await pool.query(
        'SELECT * FROM fees_paid WHERE semester_no = $1 AND user_id = $2',
        [semester.semester_no, user_id]
      );
      if (feeCheckResult.rows.length > 0 && feeCheckResult.rows[0].fees_paid === true) {
        paid = true;
      }
    }
    
    res.render('fee', { user, semester, paid });
  } catch (error) {
    console.error("Error retrieving fee details:", error);
    res.status(500).send("Error retrieving fee details: " + error.message);
  }
});

// Faculty login page
app.get('/faculty', (req, res) => {
  res.render('faculty-login', { title: 'Faculty Login' });
});

// Faculty Registration page
app.get('/facultyregister', (req, res) => {
  res.render('faculty-register', { title: 'Faculty Registration' });
});

app.get('/faculty/dashboard', async (req, res) => {
  try {
    const faculty_id = req.query.faculty_id;

    const facultyResult = await pool.query('SELECT * FROM faculty WHERE fac_id = $1', [faculty_id]);
    if (facultyResult.rows.length === 0) {
      return res.status(404).send("Faculty not found.");
    }
    const faculty = facultyResult.rows[0];
    
    const coursesResult = await pool.query(
      `SELECT c.* FROM courses c WHERE c.fac_id = $1`, [faculty_id]
    );
    const courses = coursesResult.rows;

    const usersResult = await pool.query(`SELECT * FROM users`);
    const users = usersResult.rows;

    let registrations = [];
    const regResult = await pool.query(
      `SELECT r.registration_id, r.user_id, u.name AS user_name, r.course_id 
      FROM registrations r 
      JOIN users u ON r.user_id = u.user_id`
    );
    registrations = regResult.rows;
    
    res.render('faculty-dashboard', { faculty, courses, users, registrations });
  } catch (error) {
    console.error("Faculty dashboard error:", error);
    res.status(500).send("Error retrieving dashboard: " + error.message);
  }
});

app.get('/faculty/add-course', async (req, res) => {
  try {
    const faculty_id = req.query.faculty_id; 
    const facultyResult = await pool.query('SELECT * FROM faculty WHERE fac_id = $1', [faculty_id]);
    if (facultyResult.rows.length === 0) {
      return res.status(404).send("Faculty not found.");
    }
    const faculty = facultyResult.rows[0];
    res.render('add-course', { faculty });
  } catch (error) {
    console.error("Error in GET /faculty/add-course:", error);
    res.status(500).send("Internal server error.");
  }
});

app.get('/faculty/grades', async (req, res) => {
  try {
    const { course_id, faculty_id } = req.query;
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE course_id = $1 AND fac_id = $2',
      [course_id, faculty_id]
    );
    if (courseResult.rows.length === 0) {
      return res.status(404).send("Course not found or you are not assigned to this course.");
    }
    const course = courseResult.rows[0];

    const regResult = await pool.query(
      'SELECT * FROM registrations WHERE course_id = $1',
      [course_id]
    );
    const registrations = regResult.rows;

    const userResult = await pool.query(
      'SELECT * FROM registrations WHERE course_id = $1',
      [course_id]
    );
    const users = userResult.rows;
    
    res.render('grades', { course, registrations, users, faculty_id });
  } catch (error) {
    console.error("Error in GET /faculty/grades:", error);
    res.status(500).send("Error retrieving registrations: " + error.message);
  }
});

/*--------------------------------------------------------------------*/

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { roll_number, name, email, dob } = req.body;
    
    const newAccount = web3.eth.accounts.create();
    const wallet_address = newAccount.address;
    const privateKey = newAccount.privateKey;

    const result = await pool.query(
      `INSERT INTO users (roll_number, name, email, dob, wallet_address, private_key)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [roll_number, name, email, dob, wallet_address, privateKey]
    );
    const newUser = result.rows[0];

    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/metadata/identity/${newUser.user_id}`;
    
    const accounts = await web3.eth.getAccounts();
    
    const receipt = await identityContract.methods.mintNFT(tokenURI).send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    const tokenId = receipt.events.IdentityMinted.returnValues.tokenId;
    console.log("TokenID: ", tokenId);
    
    await pool.query(
      'UPDATE users SET identity_token = $1 WHERE user_id = $2',
      [tokenId, newUser.user_id]
    );
    
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
    
    const result = await pool.query('SELECT * FROM users WHERE roll_number = $1', [roll_number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    const user = result.rows[0];
    
    if (user.private_key !== private_key) {
      return res.status(400).json({ success: false, error: "Invalid private key." });
    }
    
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
    
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    
    const identityToken = web3.utils.toBigInt(user.identity_token);
    if (identityToken === null || identityToken === undefined) {
      return res.status(400).json({ success: false, error: 'User does not have a digital identity NFT.' });
    }
    
    const existingRegistration = await pool.query(
      'SELECT * FROM registrations WHERE user_id = $1 AND course_id = $2',
      [user_id, course_id]
    );
    if (existingRegistration.rowCount > 0) {
      return res.status(400).json({ success: false, error: 'Course already registered' });
    }
    
    const registrationResult = await pool.query(
      'INSERT INTO registrations (user_id, course_id) VALUES ($1, $2) RETURNING *',
      [user_id, course_id]
    );
    const registration = registrationResult.rows[0];

    const accounts = await web3.eth.getAccounts();
    const receipt = await courseContract.methods.registerCourse(identityToken, course_id).send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    res.status(200).json({ success: true, registration});
  } catch (error) {
    console.error("Course registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Certificate Issuance
app.post('/api/certificate', async (req, res) => {
  try {
    const { studentAddress, user_id, course_id } = req.body;
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/certificates/${user_id}-${course_id}.json`;
    const accounts = await web3.eth.getAccounts();

    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    
    const identityToken = web3.utils.toBigInt(user.identity_token);
    if (identityToken === null || identityToken === undefined) {
      return res.status(400).json({ success: false, error: 'User does not have a digital identity NFT.' });
    }

    const receipt = await certificateContract.methods.issueCertificate(identityToken, studentAddress, tokenURI).send({ from: accounts[0] });
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

// Fee Payment
app.post('/api/fees', async (req, res) => {
  try {
    const { user_id, amount } = req.body;
    
    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const user = userResult.rows[0];
    
    const semesterResult = await pool.query(
      `SELECT * FROM Semester WHERE CURRENT_DATE BETWEEN start_date AND end_date`
    );
    if (semesterResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'No active semester found' });
    }
    const semester = semesterResult.rows[0];
    
    const feeCheckResult = await pool.query(
      'SELECT * FROM fees_paid WHERE semester_no = $1 AND user_id = $2',
      [semester.semester_no, user_id]
    );
    if (feeCheckResult.rows.length > 0 && feeCheckResult.rows[0].fees_paid) {
      return res.status(400).json({ success: false, error: 'Fee already paid for this semester' });
    }
    
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/fees/metadata/${user_id}-${Date.now()}.json`;
    
    const identityToken = web3.utils.toBigInt(user.identity_token);
    if (identityToken === null || identityToken === undefined) {
      return res.status(400).json({ success: false, error: 'User does not have a digital identity NFT.' });
    }
    
    const accounts = await web3.eth.getAccounts();
    
    const receipt = await feeContract.methods.payFees(identityToken, tokenURI).send({
      from: accounts[0],
      value: web3.utils.toWei(amount, 'ether'),
      gas: 6721975,
      gasPrice: '20000000000'
    });
    
    const nftTokenId = receipt.events.FeePaid.returnValues.tokenId;
    
    const dbResult = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, transaction_hash) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, 'fee_payment', amount, receipt.transactionHash]
    );
    const transactionRecord = dbResult.rows[0];
    
    await pool.query(
      `INSERT INTO fees_paid (semester_no, user_id, fees_paid)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (semester_no, user_id)
       DO UPDATE SET fees_paid = TRUE;`,
      [semester.semester_no, user_id]
    );
    
    const currentDate = new Date().toLocaleString();
    const receiptText = `
Fee Payment Receipt
---------------------
User ID: ${user_id}
Semester No: ${semester.semester_no}
Fee Amount (ETH): ${amount}
Transaction Hash: ${receipt.transactionHash}
NFT Token ID: ${nftTokenId}
Date: ${currentDate}
`;
    
    res.setHeader('Content-Disposition', 'attachment; filename=fee_receipt.txt');
    res.setHeader('Content-Type', 'text/plain');
    res.send(receiptText);
  } catch (error) {
    console.error("Fee payment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// faculty register
app.post('/api/faculty/register', async (req, res) => {
  try {
    const { name, email, dob } = req.body;
    
    const newAccount = web3.eth.accounts.create();
    const wallet_address = newAccount.address;
    const privateKey = newAccount.privateKey;  // For demonstration only (store securely in production)
    
    const result = await pool.query(
      `INSERT INTO faculty (name, email, dob, wallet_address, private_key)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, dob, wallet_address, privateKey]
    );
    const newFaculty = result.rows[0];
    
    const tokenURI = `http://localhost:${process.env.PORT || 3000}/api/metadata/faculty/${newFaculty.fac_id}`;
    
    const accounts = await web3.eth.getAccounts();
    
    const receipt = await identityContract.methods.mintNFT(tokenURI)
      .send({ from: accounts[0], gas: 6721975, gasPrice: '20000000000' });
    
    const tokenId = receipt.events.IdentityMinted.returnValues.tokenId;
    console.log("Faculty NFT Token ID: ", tokenId);
    
    await pool.query(
      'UPDATE faculty SET identity_token = $1 WHERE fac_id = $2',
      [tokenId, newFaculty.fac_id]
    );
    
    res.render('faculty-register-success', {
      faculty: newFaculty,
      receipt,
      wallet: {
        address: wallet_address,
        privateKey: privateKey
      }
    });
  } catch (error) {
    console.error("Faculty registration error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Faculty login
app.post('/api/faculty/login', async (req, res) => {
  try {
    const { email, private_key } = req.body;
    
    const result = await pool.query('SELECT * FROM faculty WHERE email = $1 AND private_key = $2', [email, private_key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Faculty not found or invalid credentials." });
    }
    const faculty = result.rows[0];
    
    res.redirect('/faculty/dashboard?faculty_id=' + faculty.fac_id);
  } catch (error) {
    console.error("Faculty login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add courses
app.post('/api/faculty/add-course', async (req, res) => {
  try {
    const { fac_id, course_name, semester_no, credits } = req.body;

    const semesterResult = await pool.query(
      'SELECT start_date, end_date FROM Semester WHERE semester_no = $1',
      [semester_no]
    );
    if (semesterResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Semester not found.' });
    }
    const { start_date, end_date } = semesterResult.rows[0];

    const result = await pool.query(
      `INSERT INTO courses (course_name, fac_id, semester_no, credits, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [course_name, fac_id, semester_no, credits, start_date, end_date]
    );
    const newCourse = result.rows[0];
    
    res.redirect('/faculty/dashboard?faculty_id=' + fac_id);
  } catch (error) {
    console.error("Error in POST /api/faculty/add-course:", error);
    res.status(500).send("Error adding course: " + error.message);
  }
});

// Give grades
app.post('/api/faculty/grades', async (req, res) => {
  try {
    const { registration_id, grade } = req.body;
    
    const result = await pool.query(
      'UPDATE registrations SET grade = $1 WHERE registration_id = $2 RETURNING *',
      [grade, registration_id]
    );
    const updatedRegistration = result.rows[0];
    
    res.status(200).json({ success: true, registration: updatedRegistration });
  } catch (error) {
    console.error("Error in POST /api/faculty/give-grades:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.get('/amenities', async (req, res) => {
  try {
    const user_id = req.query.user_id;

    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found.");
    }
    const user = userResult.rows[0];

    const eventsResult = await pool.query('SELECT * FROM events');
    const events = eventsResult.rows;

    const roomsResult = await pool.query('SELECT * FROM rooms');
    const rooms = roomsResult.rows;

    const registeredEventsResult = await pool.query(
      `SELECT e.* 
       FROM event_participation ep 
       JOIN events e ON ep.event_id = e.event_id 
       WHERE ep.user_id = $1`,
      [user.user_id]
    );
    const registeredEvents = registeredEventsResult.rows;

    const bookedRoomsResult = await pool.query(
      `SELECT rb.*, r.name as room_name, r.location, r.capacity
       FROM room_booking rb
       JOIN rooms r ON rb.room_id = r.room_id
       WHERE rb.user_id = $1`,
      [user_id]
    );
    const bookedRooms = bookedRoomsResult.rows;

    res.render('amenities', { events, rooms, user_id, user, registeredEvents, bookedRooms });
  } catch (error) {
    console.error("Error fetching amenities:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


app.post('/api/bookRoom', async (req, res) => {
  try {
    const { user_id, roomId } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { wallet_address, identity_token } = userResult.rows[0];
    const accounts = await web3.eth.getAccounts();
 
    const bookingCheckResult = await pool.query(
      'SELECT * FROM room_booking WHERE user_id = $1 AND booking_date = CURRENT_DATE',
      [user_id]
    );
    if (bookingCheckResult.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'You can only book one room per day.' });
    }

    try {
      await amenitiesContract.methods.bookRoom(identity_token).call({ from: accounts[0] });
    } catch (err) {
      return res.status(400).json({ success: false, error: 'You must have an NFT to book a room.' });
    }

    const result = await pool.query(
      'INSERT INTO room_booking (user_id, room_id) VALUES ($1, $2) RETURNING *',
      [user_id, roomId]
    );

    res.status(200).json({ success: true, booking: result.rows[0] });
  } catch (error) {
    console.error("Room booking error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/participateEvent', async (req, res) => {
  try {
    const { user_id, eventId } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    const user = userResult.rows[0];
    const { wallet_address, identity_token } = user;
    const owner = await amenitiesContract.methods.checkOwnership(identity_token).call();

    const accounts = await web3.eth.getAccounts();
    const eligible = await amenitiesContract.methods.participateInEvent(identity_token).call({ from: accounts[0] });

    const participationCheck = await pool.query(
      'SELECT * FROM event_participation WHERE user_id = $1 AND event_id = $2',
      [user_id, eventId]
    );
    if (participationCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'You are already registered for this event.' });
    }

    if (!eligible) {
      return res.status(400).json({ success: false, error: 'You must have an NFT to participate in the event.' });
    }

    const participationResult = await pool.query(
      'INSERT INTO event_participation (user_id, event_id) VALUES ($1, $2) RETURNING *',
      [user_id, eventId]
    );

    const registeredEventsResult = await pool.query(
      `SELECT e.* 
       FROM event_participation ep 
       JOIN events e ON ep.event_id = e.event_id 
       WHERE ep.user_id = $1`,
      [user_id]
    );

    res.status(200).json({ 
      success: true, 
      participation: participationResult.rows[0],
      registeredEvents: registeredEventsResult.rows 
    });
  } catch (error) {
    console.error("Event participation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error route
app.use((req, res) => {
  res.status(404).render('error', { title: '404 - Not Found', message: 'Page not found.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
