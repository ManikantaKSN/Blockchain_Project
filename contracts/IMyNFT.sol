// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// Interface to check the owner of an NFT by its tokenId.
interface IMyNFT {
    // Returns the owner of the specified tokenId.
    function ownerOf(uint256 tokenId) external view returns (address);
}
