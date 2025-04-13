// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// The Migrations contract is used to manage deployment migration processes.
// It is typically part of a deployment framework and helps track which migrations have been completed.
contract Migrations {
    // The address of the contract owner (typically the deployer).
    address public owner;
    
    // Stores the id/number of the last migration that was completed.
    uint public last_completed_migration;

    // The constructor is executed only once when the contract is deployed.
    // It sets the owner to the address that deploys the contract.
    constructor() {
        owner = msg.sender;
    }

    // Modifier 'restricted' ensures that only the owner can call certain functions.
    // It verifies that the sender is indeed the owner before allowing the function execution.
    modifier restricted() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _; // Continue with the execution of the modified function.
    }

    // Function setCompleted allows the owner to update the last completed migration.
    // This is essential for keeping track of which migration steps have already been deployed.
    function setCompleted(uint completed) public restricted {
        last_completed_migration = completed;
    }
}
