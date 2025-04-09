// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyCourseReg {
    event CourseRegistered(address indexed student, uint256 courseId);

    // Mapping from student address to a list of course IDs
    mapping(address => uint256[]) private registrations;

    // Register a course for a student
    function registerCourse(address student, uint256 courseId) public {
        registrations[student].push(courseId);
        emit CourseRegistered(student, courseId);
    }

    // Retrieve registered courses for a student
    function getCourses(address student) public view returns (uint256[] memory) {
        return registrations[student];
    }
}
