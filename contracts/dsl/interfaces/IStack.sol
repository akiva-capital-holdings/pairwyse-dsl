// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IStack {
    function stack(uint256) external returns (uint256);

    function length() external view returns (uint256);

    function push(uint256 data) external;

    function pop() external returns (uint256);
}
