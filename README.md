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
