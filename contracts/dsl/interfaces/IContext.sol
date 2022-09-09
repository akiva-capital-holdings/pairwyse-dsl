// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '../helpers/Stack.sol';

interface IContext {
    enum OpcodeLibNames {
        ComparisonOpcodes,
        BranchingOpcodes,
        LogicalOpcodes,
        OtherOpcodes
    }

    // Variables
    function anyone() external view returns (address);

    function stack() external view returns (Stack);

    function program() external view returns (bytes memory);

    function pc() external view returns (uint256);

    function nextpc() external view returns (uint256);

    function appAddr() external view returns (address);

    function msgSender() external view returns (address);

    function comparisonOpcodes() external view returns (address);

    function branchingOpcodes() external view returns (address);

    function logicalOpcodes() external view returns (address);

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

    function aliases(string memory _alias) external view returns (string memory _baseCmd);

    // Functions

    function operatorsLen() external view returns (uint256);

    function setComparisonOpcodesAddr(address _opcodes) external;

    function setBranchingOpcodesAddr(address _opcodes) external;

    function setLogicalOpcodesAddr(address _opcodes) external;

    function setOtherOpcodesAddr(address _opcodes) external;

    function setProgram(bytes memory _data) external;

    function programAt(uint256 _index, uint256 _step) external view returns (bytes memory);

    function programSlice(
        bytes calldata _payload,
        uint256 _index,
        uint256 _step
    ) external view returns (bytes memory);

    function setPc(uint256 _pc) external;

    function setNextPc(uint256 _nextpc) external;

    function incPc(uint256 _val) external;

    function setAppAddress(address _addr) external;

    function setMsgSender(address _msgSender) external;

    function setMsgValue(uint256 _msgValue) external;
}
