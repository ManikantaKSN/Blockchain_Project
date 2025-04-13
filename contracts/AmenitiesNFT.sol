// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Import the IMyNFT interface to interact with an external NFT contract.
// This interface provides the function to check the owner of a given token.
import "./IMyNFT.sol";

// The AmenitiesNFT contract is used to verify whether a caller owns a specific NFT
// (their digital identity) which is required to access certain amenities.
contract AmenitiesNFT {
    // Reference to the NFT contract that implements IMyNFT.
    IMyNFT public nftContract;

    /**
     * @notice Constructor that sets the NFT contract address.
     * @param _nftContractAddress The address of an already deployed NFT contract.
     * The NFT contract is used for verifying ownership of NFT identities.
     */
    constructor(address _nftContractAddress) {
        nftContract = IMyNFT(_nftContractAddress);
    }

    /**
     * @notice Checks if the caller owns the specified token ID.
     * @param tokenId The NFT token ID that represents the digital identity.
     * @return A boolean value: true if the caller owns the token, false otherwise.
     */
    function hasNFT(uint256 tokenId) public view returns (bool) {
        // Calls the external NFT contract's ownerOf() function and compares it with msg.sender.
        return nftContract.ownerOf(tokenId) == msg.sender;
    }

    /**
     * @notice Retrieves the owner of a given token ID.
     * @param tokenId The NFT token ID.
     * @return The address that owns the token.
     */
    function checkOwnership(uint256 tokenId) public view returns (address) {
        // Return the owner of the token from the external NFT contract.
        return nftContract.ownerOf(tokenId);
    }

    /**
     * @notice Verifies that the caller is eligible to participate in an event.
     * @param tokenId The NFT token ID that represents the digital identity.
     * @return true if the caller owns the NFT, otherwise the function reverts.
     *
     * Requirements:
     * - The caller must own the NFT identified by tokenId.
     */
    function participateInEvent(uint256 tokenId) external view returns (bool) {
        // Ensures the caller owns the NFT. If not, it reverts with an error message.
        require(hasNFT(tokenId), "You must own the NFT to participate in the event.");
        return true;
    }

    /**
     * @notice Verifies that the caller is eligible to book a room.
     * @param tokenId The NFT token ID representing the caller's digital identity.
     * @return true if the caller owns the NFT, otherwise the function reverts.
     *
     * Requirements:
     * - The caller must own the NFT identified by tokenId.
     */
    function bookRoom(uint256 tokenId) external view returns (bool) {
        // Ensures the caller owns the NFT. If not, it reverts with an error message.
        require(hasNFT(tokenId), "You must own the NFT to book a room.");
        return true;
    }
}
