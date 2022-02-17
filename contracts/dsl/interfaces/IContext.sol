// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '../helpers/Stack.sol';

interface IContext {
    enum OpcodeLibNames {
        ComparatorOpcodes,
        LogicalOpcodes,
        SetOpcodes,
        OtherOpcodes
    }

    // Variables
    function stack() external view returns (Stack);

    function program() external view returns (bytes memory);

    function pc() external view returns (uint256);

    function nextpc() external view returns (uint256);

    function appAddress() external view returns (address);

    function msgSender() external view returns (address);

    function comparatorOpcodes() external view returns (address);

    function logicalOpcodes() external view returns (address);

    function setOpcodes() external view returns (address);

    function otherOpcodes() external view returns (address);

    function msgValue() external view returns (uint256);

    function opCodeByName(string memory _name) external view returns (bytes1 _opcode);

    function selectorByOpcode(bytes1 _opcode) external view returns (bytes4 _selecotor);

    function opcodeLibNameByOpcode(bytes1 _opcode) external view returns (OpcodeLibNames _name);

    function asmSelectors(string memory _name) external view returns (bytes4 _selecotor);

    function opsPriors(string memory _name) external view returns (uint256 _priority);

    function operators(uint256 _index) external view returns (string memory _operator);

    function branchSelectors(string memory _baseOpName, bytes1 _branchCode)
        external
        view
        returns (bytes4 _selector);

    function branchCodes(string memory _baseOpName, string memory _branchName)
        external
        view
        returns (bytes1 _branchCode);

    // Functions

    function initOpcodes() external;

    function operatorsLen() external view returns (uint256);

    function setComparatorOpcodesAddr(address _opcodes) external;

    function setLogicalOpcodesAddr(address _opcodes) external;

    function setSetOpcodesAddr(address _opcodes) external;

    function setOtherOpcodesAddr(address _opcodes) external;

    // function addOpcode(
    //     string memory _name,
    //     bytes1 _opcode,
    //     bytes4 _opSelector,
    //     bytes4 _asmSelector,
    //     OpcodeLibNames _libName
    // ) external;

    // function addOpcodeForOperator(
    //     string memory _name,
    //     bytes1 _opcode,
    //     bytes4 _opSelector,
    //     bytes4 _asmSelector,
    //     OpcodeLibNames _libName,
    //     uint256 _priority
    // ) external;

    // function addOpcodeBranch(
    //     string memory _baseOpName,
    //     string memory _branchName,
    //     bytes1 _branchCode,
    //     bytes4 _selector
    // ) external;

    function setProgram(bytes memory _data) external;

    function programAt(uint256 _index, uint256 _step) external view returns (bytes memory);

    function programSlice(
        bytes calldata _payload,
        uint256 _index,
        uint256 _step
    ) external pure returns (bytes memory);

    function setPc(uint256 _pc) external;

    function setNextPc(uint256 _nextpc) external;

    function incPc(uint256 _val) external;

    function setAppAddress(address _addr) external;

    function setMsgSender(address _msgSender) external;

    function setMsgValue(uint256 _msgValue) external;
}