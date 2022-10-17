// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ILinkedList {
    /**
     * @dev Returns length of the array
     * @param _arrName is a bytecode of the array name
     */
    function getType(bytes32 _arrName) external view returns (bytes32);

    /**
     * @dev Returns length of the array
     * @param _arrName is a bytecode of the array name
     */
    function getLength(bytes32 _arrName) external view returns (uint256);
}
