// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack } from './helpers/Stack.sol';
import 'hardhat/console.sol';

// TODO: may be wise to split Context into:
//      contract A (holds opCodeByName, selectorByOpcode, and asmSelectors)
//      contract B (holds particular state variables: stack, program, pc, appAddress, msgSender)
contract Context is IContext {
    Stack public override stack;
    bytes public override program;
    uint256 public override pc;
    address public override appAddress;
    address public override msgSender;
    address public override opcodes;

    mapping(string => bytes1) public override opCodeByName; // name => hex
    mapping(bytes1 => bytes4) public override selectorByOpcode;
    mapping(string => bytes4) public override asmSelectors;

    // baseOpName -> branchCode -> selector
    mapping(string => mapping(bytes1 => bytes4)) public override branchSelectors;

    // baseOpName -> branchName -> branchCode
    mapping(string => mapping(string => bytes1)) public override branchCodes;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), 'Context: address is zero');
        _;
    }

    constructor() {
        stack = new Stack();
    }

    function setOpcodesAddr(address _opcodes) public {
        opcodes = _opcodes;
    }

    function addOpcode(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector
    ) public override {
        require(_opSelector != bytes4(0), 'Context: empty opcode selector');
        require(
            opCodeByName[_name] == bytes1(0) && selectorByOpcode[_opcode] == bytes4(0),
            'Context: duplicate opcode name or code'
        );
        opCodeByName[_name] = _opcode;
        selectorByOpcode[_opcode] = _opSelector;
        asmSelectors[_name] = _asmSelector;
    }

    function addOpcodeBranch(
        string memory _baseOpName,
        string memory _branchName,
        bytes1 _branchCode,
        bytes4 _selector
    ) public override {
        require(_selector != bytes4(0), 'Context: empty opcode selector');
        require(
            branchSelectors[_baseOpName][_branchCode] == bytes4(0) &&
                branchCodes[_baseOpName][_branchName] == bytes1(0),
            'Context: duplicate opcode branch'
        );
        branchSelectors[_baseOpName][_branchCode] = _selector;
        branchCodes[_baseOpName][_branchName] = _branchCode;
    }

    function setProgram(bytes memory _data) public override {
        program = _data;
        setPc(0);
    }

    function programAt(uint256 _index, uint256 _step) public view override returns (bytes memory) {
        bytes memory data = program;
        return this.programSlice(data, _index, _step);
    }

    function programSlice(
        bytes calldata _payload,
        uint256 _index,
        uint256 _step
    ) public pure override returns (bytes memory) {
        require(_payload.length > _index, 'Context: slicing out of range');
        return _payload[_index:_index + _step];
    }

    function setPc(uint256 _pc) public override {
        pc = _pc;
    }

    function incPc(uint256 _val) public override {
        pc += _val;
    }

    function setAppAddress(address _addr) public override nonZeroAddress(_addr) {
        appAddress = _addr;
    }

    function setMsgSender(address _msgSender) public override nonZeroAddress(_msgSender) {
        msgSender = _msgSender;
    }
}
