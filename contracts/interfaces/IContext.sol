//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Stack.sol";

interface IContext {
    function stack() external returns (Stack);

    function program() external returns (bytes memory);

    function pc() external returns (uint256);

    function parser() external returns (address);

    function appAddress() external returns (address);

    function addOpcode(
        string memory name,
        bytes1 opcode,
        bytes4 opSelector,
        bytes4 asmSelector
    ) external;

    function setProgram(bytes memory data) external;

    function programAt(uint256 index, uint256 step) external view returns (bytes memory);

    function branchSelectors(string memory baseOpName, bytes1 branchCode) external view returns (bytes4);

    function programSlice(
        bytes calldata payload,
        uint256 index,
        uint256 step
    ) external pure returns (bytes memory);

    function setPc(uint256 value) external;

    function incPc(uint256 value) external;
}
