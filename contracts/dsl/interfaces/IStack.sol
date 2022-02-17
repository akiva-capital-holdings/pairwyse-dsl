// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import './IStackValue.sol';

interface IStack {
    function stack(uint256) external returns (IStackValue);

    function length() external view returns (uint256);

    function push(IStackValue data) external;

    function pop() external returns (IStackValue);
}
