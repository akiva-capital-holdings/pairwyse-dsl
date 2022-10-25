// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ILinkedList {
    function getType(bytes32 _arrName) external view returns (bytes1);

    function getLength(bytes32 _arrName) external view returns (uint256);

    function get(uint256 _index, bytes32 _arrName) external view returns (bytes32 data);
}
