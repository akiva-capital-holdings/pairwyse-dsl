//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./IStackValue.sol";

interface IStack {
    function stack(uint) external returns(IStackValue);
    function length() external view returns (uint);
    function push(IStackValue data) external;
    function pop() external returns (IStackValue);
}
