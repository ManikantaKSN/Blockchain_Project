// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IMyNFT.sol";

contract AmenitiesNFT {
    IMyNFT public nftContract;

    // Constructor accepts the address of the deployed NFT contract.
    constructor(address _nftContractAddress) {
        nftContract = IMyNFT(_nftContractAddress);
    }

    // Check if the caller owns the specified token ID (their digital identity).
    function hasNFT(uint256 tokenId) public view returns (bool) {
        return nftContract.ownerOf(tokenId) == msg.sender;
    }

    // Return the owner of a given token ID.
    function checkOwnership(uint256 tokenId) public view returns (address) {
        return nftContract.ownerOf(tokenId);
    }

    // Verify participation eligibility: require that the caller owns the token.
    function participateInEvent(uint256 tokenId) external view returns (bool) {
        require(hasNFT(tokenId), "You must own the NFT to participate in the event.");
        return true;
    }

    // Verify room booking eligibility: require that the caller owns the token.
    function bookRoom(uint256 tokenId) external view returns (bool) {
        require(hasNFT(tokenId), "You must own the NFT to book a room.");
        return true;
    }
}
