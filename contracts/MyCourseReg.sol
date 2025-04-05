// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyCourseReg {
    event CourseRegistered(address indexed student, uint256 courseId);
    mapping(address => uint256[]) private registrations;

    function registerCourse(address student, uint256 courseId) public {
        registrations[student].push(courseId);
        emit CourseRegistered(student, courseId);
    }

    function getCourses(address student) public view returns (uint256[] memory) {
        return registrations[student];
    }
}
