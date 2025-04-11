// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract CourseReg {
    event CourseRegistered(address indexed student, uint256 courseId);

    // Mapping from student address to an array of course IDs they've registered for.
    mapping(address => uint256[]) private registrations;

    // Register a course for a student.
    // The student parameter should be a valid Ethereum address (ideally, the wallet that holds their identity NFT).
    function registerCourse(address student, uint256 courseId) public {
        registrations[student].push(courseId);
        emit CourseRegistered(student, courseId);
    }

    // Retrieve the list of courses a student has registered for.
    function getCourses(address student) public view returns (uint256[] memory) {
        return registrations[student];
    }
}
