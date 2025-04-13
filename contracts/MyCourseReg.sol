// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Import the IMyNFT interface to interact with an external NFT contract.
// This interface is used to verify ownership of NFT identities.
import "./IMyNFT.sol";

// MyCourseReg contract enables users to register for courses using their NFT identity.
// It stores and manages the courses each user (identified by their NFT) is registered for.
contract MyCourseReg {
    // Event emitted when a course registration occurs.
    // Indexed parameters allow for efficient filtering of events in the logs.
    event CourseRegistered(uint256 indexed tokenId, address indexed owner, uint256 courseId);

    // Mapping that stores an array of course IDs for each NFT identity token.
    // The key is the NFT token ID and the value is an array of course IDs associated with that token.
    mapping(uint256 => uint256[]) private registrations;

    // The instance of the IMyNFT contract to interact with the NFT contract functionality.
    // This is used to verify the NFT ownership during course registration.
    IMyNFT public nftContract;

    // Constructor to initialize the contract with the NFT contract address.
    // It assigns the nftContract variable to the provided contract address.
    constructor(address _nftContractAddress) {
        nftContract = IMyNFT(_nftContractAddress);
    }

    // Function to register a course for a user.
    // Parameters:
    // - identityToken: The NFT token ID representing the user's digital identity.
    // - courseId: The identifier for the course to register.
    function registerCourse(uint256 identityToken, uint256 courseId) public {
        // Check that the caller is the owner of the NFT identity.
        // The ownerOf method is defined in the IMyNFT interface.
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");

        // Add the courseId to the list of courses registered under the given NFT identity token.
        registrations[identityToken].push(courseId);

        // Emit an event to log the course registration.
        emit CourseRegistered(identityToken, msg.sender, courseId);
    }

    // Function to retrieve all courses registered under a given NFT identity token.
    // It returns an array of course IDs associated with the provided token.
    function getCourses(uint256 identityToken) public view returns (uint256[] memory) {
        return registrations[identityToken];
    }
}
