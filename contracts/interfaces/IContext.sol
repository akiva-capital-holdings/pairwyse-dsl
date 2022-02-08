// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '../helpers/Stack.sol';

interface IContext {
    // Variables
    function stack() external returns (Stack);

    function program() external returns (bytes memory);

    function pc() external returns (uint256);

    function nextpc() external returns (uint256);

    function appAddress() external returns (address);

    function msgSender() external returns (address);

    function opcodes() external returns (address);

    function msgValue() external returns (uint256);

    function opCodeByName(string memory _name) external returns (bytes1 _opcode);

    function selectorByOpcode(bytes1 _opcode) external returns (bytes4 _selecotor);

    function asmSelectors(string memory _name) external returns (bytes4 _selecotor);

    function branchSelectors(string memory _baseOpName, bytes1 _branchCode)
        external
        view
        returns (bytes4 _selector);

    function branchCodes(string memory _baseOpName, string memory _branchName)
        external
        view
        returns (bytes1 _branchCode);

    // Functions

    function setOpcodesAddr(address _opcodes) external;

    function addOpcode(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector
    ) external;

    function addOpcodeBranch(
        string memory _baseOpName,
        string memory _branchName,
        bytes1 _branchCode,
        bytes4 _selector
    ) external;

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
