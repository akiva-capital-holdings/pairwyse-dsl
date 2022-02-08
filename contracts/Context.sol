// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack } from './helpers/Stack.sol';
import 'hardhat/console.sol';

// TODO: may be wise to split Context into:
//      contract A (holds opCodeByName, selectorByOpcode, and asmSelectors)
//      contract B (holds particular state variables: stack, program, pc, appAddress, msgSender)
contract Context is IContext {
    Stack public stack;
    bytes public program;
    uint256 public pc;
    uint256 public nextpc;
    address public appAddress;
    address public msgSender;
    address public opcodes;
    uint256 public msgValue;

    mapping(string => bytes1) public opCodeByName; // name => hex
    mapping(bytes1 => bytes4) public selectorByOpcode;
    mapping(string => bytes4) public asmSelectors;

    // baseOpName -> branchCode -> selector
    mapping(string => mapping(bytes1 => bytes4)) public branchSelectors;

    // baseOpName -> branchName -> branchCode
    mapping(string => mapping(string => bytes1)) public branchCodes;

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
    ) public {
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
    ) public {
        require(_selector != bytes4(0), 'Context: empty opcode selector');
        require(
            branchSelectors[_baseOpName][_branchCode] == bytes4(0) &&
                branchCodes[_baseOpName][_branchName] == bytes1(0),
            'Context: duplicate opcode branch'
        );
        branchSelectors[_baseOpName][_branchCode] = _selector;
        branchCodes[_baseOpName][_branchName] = _branchCode;
    }

    function setProgram(bytes memory _data) public {
        program = _data;
        setPc(0);
    }

    function programAt(uint256 _index, uint256 _step) public view returns (bytes memory) {
        bytes memory data = program;
        return this.programSlice(data, _index, _step);
    }

    function programSlice(
        bytes calldata _payload,
        uint256 _index,
        uint256 _step
    ) public pure returns (bytes memory) {
        require(_payload.length > _index, 'Context: slicing out of range');
        return _payload[_index:_index + _step];
    }

    function setPc(uint256 _pc) public {
        pc = _pc;
    }

    function setNextPc(uint256 _nextpc) public {
        nextpc = _nextpc;
    }

    function incPc(uint256 _val) public {
        pc += _val;
    }

    function setAppAddress(address _addr) public nonZeroAddress(_addr) {
        appAddress = _addr;
    }

    function setMsgSender(address _msgSender) public nonZeroAddress(_msgSender) {
        msgSender = _msgSender;
    }

    function setMsgValue(uint256 _msgValue) public {
        msgValue = _msgValue;
    }
}
