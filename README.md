# Project: NFT‑enabled Identity and Access Management

## Installation Guide

Follow these steps to set up, deploy, and run the project locally.

### 1. Prerequisites

- **Node.js:**  
  Install Node.js (preferably version 20).  
  Verify installation by running:
    *node -v*
    *npm -v*

- **PostgreSQL:**  
  Install PostgreSQL and ensure it’s running.  
  Update the connection parameters in the `.env` file.

- **Truffle:**  
  Install Truffle globally:
    *npm install -g truffle*

- **Ganache GUI:**  
  Download and install Ganache GUI from the Truffle Suite website.  
  (This tool will simulate your blockchain network.)

---

### 2. Project Setup

1. **Clone the Project Repository:**  
   Clone the project repository to your local machine.

2. **Configure Environment Variables:**  
   Create a `.env` file in the project root and update it with your PostgreSQL connection parameters and other configuration values. For example:
   *
   DB_USER=your_db_username
   DB_PASS=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nft_identity
   PORT=3000
   *

3. **Install Node Modules:**  
   In the project directory, run:
     *npm install*

---

### 4. Deploy Smart Contracts

1. **Start Ganache:**  
   Open Ganache GUI.  
   - Create a new workspace and select your project directory as the workspace directory.  
   - Click "Save Workspace" and then "Start the Workspace" to launch Ganache.

2. **Compile and Migrate Contracts:**  
   Open a new terminal in your project directory and run:
     *truffle migrate --network development*
   This compiles and deploys your smart contracts (digital identity, certificate, fee payment, etc.) to the Ganache network.  
   Ensure your migration files pass the required constructor parameters (e.g., NFT contract addresses) as described in the project documentation.

---

### 5. Start the Local Server

    Open another terminal in your project directory and run: 
    *npm start*
    This starts your Express server (typically on port 3000). You should see a message indicating that the server is running.

---

### 6. Verify Installation

1. **Open a Browser:**
   Navigate to `http://localhost:3000`.  
   You should see the login page (for either students or faculty, as per your implementation).

2. **Test Key Features:**
   - **Registration:** Register a new user/student, an NFT is minted and data is stored in the database.
   - **Course Registration, Fee Payment, Certificate Issuance, and Amenities:** Navigate through the respective pages to test each module.

3. **Faculty Functionality:**
   - **Start:** Navigate to `http://localhost:3000/faculty`.
   - **Course Creation, Grade Issuance:** Navigate through the respective pages to test each module.

Below is an example documentation file (in Markdown format) that explains what each function and endpoint in your index.js file does. You can save this text as, for example, `INDEX_DOC.md` in your project’s root directory.

---

## Index.js Documentation

This document explains the purpose and functionality of each endpoint and function in the `index.js` file of the NFT-Enabled Identity and Access Management project. The file integrates blockchain interactions (via web3 and smart contracts), PostgreSQL database operations (via pool queries), and Express server endpoints that render EJS views.

---

## Table of Contents

1. [Metadata Endpoint](#metadata-endpoint)
2. [Page Rendering Endpoints](#page-rendering-endpoints)
   - Default Page (`/`)
   - Login Page (`/login`)
   - Registration Page (`/register`)
   - Dashboard Page (`/dashboard`)
   - Course Registration Page (`/course`)
   - Certificate Page (`/certificate`)
   - Certificate Download Endpoint (`/api/certificate/download`)
   - Fee Payment Page (`/fees`)
   - Faculty Login Page (`/faculty`)
   - Faculty Registration Page (`/facultyregister`)
   - Faculty Dashboard (`/faculty/dashboard`)
   - Faculty Add Course Page (`/faculty/add-course`)
   - Faculty Grades Page (`/faculty/grades`)
3. [API Endpoints](#api-endpoints)
   - User Registration (`POST /api/register`)
   - User Login (`POST /api/login`)
   - Course Registration (`POST /api/course/register`)
   - Certificate Issuance (`POST /api/certificate`)
   - Fee Payment (`POST /api/fees`)
   - Faculty Registration (`POST /api/faculty/register`)
   - Faculty Login (`POST /api/faculty/login`)
   - Faculty Add Course (`POST /api/faculty/add-course`)
   - Faculty Update Grades (`POST /api/faculty/grades`)
   - Participate in Event (`POST /api/participateEvent`)
   - Book Room (`POST /api/bookRoom`)
4. [Error Handling](#error-handling)
5. [General Notes](#general-notes)

---

## Metadata Endpoint

### `GET /api/metadata/identity/:userId`

- **Purpose:**  
  Returns a JSON object containing the digital identity metadata for the user with the given userId.
- **Operation:**  
  1. Retrieves the user's name, date of birth, and roll number from the database.
  2. Constructs a metadata object with descriptive attributes.
  3. Returns the metadata in JSON format.
- **Usage Example:**  
  Request: `GET http://localhost:3000/api/metadata/identity/1`  
  Response: Metadata JSON object with user details.

---

## Page Rendering Endpoints

### `GET /`

- **Purpose:**  
  Renders the default login page.
- **Operation:**  
  Calls the EJS view `login.ejs` with the title "Login".

### `GET /login`

- **Purpose:**  
  Renders the login page.
- **Operation:**  
  Similar to the default route; renders `login.ejs`.

### `GET /register`

- **Purpose:**  
  Renders the user (student) registration page.
- **Operation:**  
  Renders the `register.ejs` view with the title "User Registration".

### `GET /dashboard`

- **Purpose:**  
  Renders the student dashboard.
- **Operation:**  
  1. Retrieves the user details using the provided `user_id` query parameter.
  2. Retrieves the courses that the user has registered for (joins `registrations` and `courses`).
  3. Renders the `dashboard.ejs` view, passing along the user object and courses.

### `GET /course`

- **Purpose:**  
  Renders the course registration page for students.
- **Operation:**  
  1. Retrieves user details.
  2. Retrieves available courses from the `courses` table.
  3. Retrieves active semester details and checks if fee is paid.
  4. Renders `course.ejs` with user, courses, and a Boolean value `feePaid` (used to conditionally enable or disable registration).

### `GET /certificate`

- **Purpose:**  
  Renders the certificate page, listing courses for which the student can download certificates.
- **Operation:**  
  Retrieves user details and the student's course registrations (with course names, grade, and course end date) and renders `certificate.ejs`.

### `GET /api/certificate/download`

- **Purpose:**  
  Allows downloading a certificate as a text file if the student is eligible.
- **Operation:**  
  1. Retrieves registration data including course details.
  2. Checks if the current date is past the course end date and if the grade is above a certain threshold (grade > 4).
  3. Calls the CertificateNFT smart contract to issue a certificate NFT.
  4. Inserts a record into the `certificates` table.
  5. Returns a downloadable text file (receipt) with certificate details (including NFT Token ID).

### `GET /fees`

- **Purpose:**  
  Renders the fee payment page.
- **Operation:**  
  1. Retrieves the user’s details.
  2. Retrieves the active semester from the `Semester` table.
  3. Checks the `fees_paid` table to determine if the fee for the active semester has already been paid.
  4. Renders `fee.ejs` with user details, active semester, and a Boolean `paid` status.

### `GET /faculty`

- **Purpose:**  
  Renders the faculty login page.
- **Operation:**  
  Renders `faculty-login.ejs` with the title "Faculty Login".

### `GET /facultyregister`

- **Purpose:**  
  Renders the faculty registration page.
- **Operation:**  
  Renders `faculty-register.ejs` with the title "Faculty Registration".

### `GET /faculty/dashboard`

- **Purpose:**  
  Renders the faculty dashboard.
- **Operation:**  
  1. Retrieves faculty details using `fac_id` query parameter.
  2. Retrieves courses taught by the faculty.
  3. Retrieves all users (or student registrations) and registration details (via a join between `registrations` and `users`).
  4. Renders `faculty-dashboard.ejs`, passing `faculty`, `courses`, and `registrations`.

### `GET /faculty/add-course`

- **Purpose:**  
  Renders the "Add Course" page for faculty.
- **Operation:**  
  Retrieves faculty details and renders `add-course.ejs` for adding a course.

### `GET /faculty/grades`

- **Purpose:**  
  Renders the "Give Grades" page for a specific course.
- **Operation:**  
  1. Validates that the course belongs to the faculty.
  2. Retrieves registrations for the course.
  3. Renders `grades.ejs` (or `faculty-grades.ejs`) with course details, registrations, and faculty_id.

---

## API Endpoints

### `POST /api/register`

- **Purpose:**  
  Registers a new student.
- **Operation:**  
  1. Generates a new Ethereum account (wallet).
  2. Inserts student details (roll_number, name, email, dob, wallet_address, and private_key) into `users` table.
  3. Mints an NFT for the student using `identityContract.mintNFT`.
  4. Updates the student's record with the minted NFT token ID.
  5. Renders `register-success.ejs` with the student’s details and wallet information.

### `POST /api/login`

- **Purpose:**  
  Authenticates a student.
- **Operation:**  
  1. Retrieves user details using the provided roll_number.
  2. Compares the provided private key with the stored one.
  3. If valid, redirects to the student dashboard.

### `POST /api/course/register`

- **Purpose:**  
  Registers a student for a course.
- **Operation:**  
  1. Retrieves the student's details and ensures that the student has a valid digital identity NFT.
  2. Checks if the student has already registered for the selected course.
  3. Inserts a record into the `registrations` table.
  4. Calls `courseContract.registerCourse` with the NFT identity.
  5. Returns a JSON response with the registration record.

### `POST /api/certificate`

- **Purpose:**  
  Issues a certificate NFT for a completed course.
- **Operation:**  
  1. Validates the student's eligibility (course ended and grade > threshold).
  2. Calls `certificateContract.issueCertificate` using the student's NFT identity.
  3. Inserts a new record into the `certificates` table.
  4. Returns a downloadable certificate receipt with NFT Token ID.

### `POST /api/fees`

- **Purpose:**  
  Processes fee payment for the active semester.
- **Operation:**  
  1. Retrieves the student's details and the active semester.
  2. Checks if the fee for that semester has already been paid.
  3. Calls `feeContract.payFees` with the student’s NFT identity.
  4. Inserts a record into the `transactions` table.
  5. Updates the `fees_paid` table to mark the fee as paid.
  6. Generates a downloadable fee receipt (text file) including the NFT token ID.

### `POST /api/faculty/register`

- **Purpose:**  
  Registers a new faculty member.
- **Operation:**  
  1. Generates a new Ethereum account (wallet) for the faculty.
  2. Inserts faculty details (name, email, dob, wallet_address, and private_key) into `faculty` table.
  3. Mints an NFT for the faculty using `identityContract.mintNFT`.
  4. Updates the faculty record with the NFT token ID.
  5. Renders `faculty-register-success.ejs` with the faculty's details.

### `POST /api/faculty/login`

- **Purpose:**  
  Authenticates a faculty member.
- **Operation:**  
  1. Retrieves faculty details based on email and private_key.
  2. If valid, redirects to the faculty dashboard.

### `POST /api/faculty/add-course`

- **Purpose:**  
  Allows faculty to add a new course.
- **Operation:**  
  1. Retrieves course timing (start_date, end_date) from the Semester table using the provided semester_no.
  2. Inserts a new record into the `courses` table with the provided course details.
  3. Redirects back to the faculty dashboard.

### `POST /api/faculty/grades`

- **Purpose:**  
  Allows faculty to update a grade for a specific registration.
- **Operation:**  
  1. Accepts a registration_id and new grade as input.
  2. Updates the grade in the `registrations` table.
  3. Returns the updated registration data in JSON format.

### `POST /api/participateEvent`

- **Purpose:**  
  Registers a student's participation in an event.
- **Operation:**  
  1. Retrieves the student's details and verifies NFT ownership using `amenitiesContract`.
  2. Checks for duplicate registrations in `event_participation`.
  3. Inserts a new record into `event_participation`.
  4. Retrieves and returns all events the student is registered in.

### `POST /api/bookRoom`

- **Purpose:**  
  Books a room for a student.
- **Operation:**  
  1. Retrieves the student's details and verifies NFT ownership using `amenitiesContract`.
  2. Checks if the student already has a booking for the current day (using `booking_date`).
  3. If not, inserts a new room booking record in `room_booking`.
  4. Returns the booking record in JSON format.

---

## Error Handling

- **General Approach:**  
  Each endpoint uses try/catch blocks to handle errors and logs the error details to the console.
- **Duplicate or Invalid Data Checks:**  
  Endpoints such as course registration, event participation, and room booking ensure that duplicate entries (e.g., registering for the same course or event, or booking a room more than once per day) are prevented.
- **NFT Ownership Verification:**  
  Several endpoints check for NFT ownership using methods on smart contracts (e.g., `amenitiesContract.checkOwnership`, `participateInEvent`, `bookRoom`), returning appropriate error responses when the user does not have the required NFT.

---

## General Notes

- **Blockchain Integration:**  
  All interactions with smart contracts (minting NFTs, verifying NFT ownership, etc.) are handled using the web3 library. The contracts are deployed on Ganache and their ABI and addresses are loaded from the Truffle build folder.
- **Database Interaction:**  
  PostgreSQL is used to store user details, course registrations, fee payment statuses, and more. All queries use parameterized SQL for security.
- **Frontend Rendering:**  
  EJS is used to render dynamic pages. Data from the database is passed to the views to ensure that the user interface always reflects the current state of the blockchain and the off-chain database.
- **Deployment Workflow:**  
  The project includes migration scripts (using Truffle), and environment variables are managed through a `.env` file. The provided installation guide covers the necessary steps to set up and run the project.

