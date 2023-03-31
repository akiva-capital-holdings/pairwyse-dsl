/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */

pragma solidity ^0.8.0;

import '../helpers/Stack.sol';

interface IProgramContext {
    // Variables
    function ANYONE() external view returns (address);

    function stack() external view returns (Stack);

    function program() external view returns (bytes memory);

    function currentProgram() external view returns (bytes memory);

    function programAt(uint256 _start, uint256 _size) external view returns (bytes memory);

    function pc() external view returns (uint256);

    function nextpc() external view returns (uint256);

    function appAddr() external view returns (address);

    function msgSender() external view returns (address);

    function msgValue() external view returns (uint256);

    function isStructVar(string memory _varName) external view returns (bool);

    function labelPos(string memory _name) external view returns (uint256);

    function setLabelPos(string memory _name, uint256 _value) external;

    function forLoopIterationsRemaining() external view returns (uint256);

    function setProgram(bytes memory _data) external;

    function setPc(uint256 _pc) external;

    function setNextPc(uint256 _nextpc) external;

    function incPc(uint256 _val) external;

    function setMsgSender(address _msgSender) external;

    function setMsgValue(uint256 _msgValue) external;

    function setStructVars(
        string memory _structName,
        string memory _varName,
        string memory _fullName
    ) external;

    function structParams(
        bytes4 _structName,
        bytes4 _varName
    ) external view returns (bytes4 _fullName);

    function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external;
}
