// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./IMyNFT.sol";

contract MyCourseReg {
    event CourseRegistered(uint256 indexed tokenId, address indexed owner, uint256 courseId);

    mapping(uint256 => uint256[]) private registrations;

    IMyNFT public nftContract;

    constructor(address _nftContractAddress) {
        nftContract = IMyNFT(_nftContractAddress);
    }

    function registerCourse(uint256 identityToken, uint256 courseId) public {
        require(nftContract.ownerOf(identityToken) == msg.sender, "Caller does not own the NFT identity");
        registrations[identityToken].push(courseId);
        emit CourseRegistered(identityToken, msg.sender, courseId);
    }

    function getCourses(uint256 identityToken) public view returns (uint256[] memory) {
        return registrations[identityToken];
    }
}
