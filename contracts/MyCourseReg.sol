// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IMyNFT.sol";

contract MyCourseReg {
    // Event including NFT token id as identity, caller's address, and course id.
    event CourseRegistered(uint256 indexed tokenId, address indexed owner, uint256 courseId);

    // Mapping from NFT token id (digital identity) to an array of course IDs registered.
    mapping(uint256 => uint256[]) private registrations;

    // Reference to the NFT contract.
    IMyNFT public nftContract;

    // Set the NFT contract address upon deployment.
    constructor(address _nftContractAddress) {
        nftContract = IMyNFT(_nftContractAddress);
    }

    // Register a course for a user identified by their NFT token id.
    // This function first verifies that msg.sender is the owner of the NFT.
    function registerCourse(uint256 identityToken, uint256 courseId) public {
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");
        registrations[identityToken].push(courseId);
        emit CourseRegistered(identityToken, msg.sender, courseId);
    }

    // Retrieve the list of course IDs registered for a given NFT identity token.
    function getCourses(uint256 identityToken) public view returns (uint256[] memory) {
        return registrations[identityToken];
    }
}
