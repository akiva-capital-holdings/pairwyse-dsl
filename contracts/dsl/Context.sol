// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { Stack } from './helpers/Stack.sol';
import { ComparatorOpcodes } from './libs/opcodes/ComparatorOpcodes.sol';
import { LogicalOpcodes } from './libs/opcodes/LogicalOpcodes.sol';
import { SetOpcodes } from './libs/opcodes/SetOpcodes.sol';
import { OtherOpcodes } from './libs/opcodes/OtherOpcodes.sol';

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
    address public comparatorOpcodes;
    address public logicalOpcodes;
    address public setOpcodes;
    address public otherOpcodes;
    uint256 public msgValue;

    mapping(string => bytes1) public opCodeByName; // name => hex
    mapping(bytes1 => bytes4) public selectorByOpcode;
    mapping(bytes1 => OpcodeLibNames) public opcodeLibNameByOpcode;
    mapping(string => bytes4) public asmSelectors;
    mapping(string => uint256) public opsPriors;
    string[] public operators;

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

    function initOpcodes() external {
        // Opcodes for operators
        addOpcodeForOperator(
            '==',
            0x01,
            ComparatorOpcodes.opEq.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            '!=',
            0x14,
            ComparatorOpcodes.opNotEq.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            '<',
            0x03,
            ComparatorOpcodes.opLt.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            '>',
            0x04,
            ComparatorOpcodes.opGt.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            '<=',
            0x06,
            ComparatorOpcodes.opLe.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            '>=',
            0x07,
            ComparatorOpcodes.opGe.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            'swap',
            0x05,
            ComparatorOpcodes.opSwap.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            3
        );
        addOpcodeForOperator(
            '!',
            0x02,
            ComparatorOpcodes.opNot.selector,
            0x0,
            OpcodeLibNames.ComparatorOpcodes,
            4
        );

        addOpcodeForOperator(
            'and',
            0x12,
            SetOpcodes.opAnd.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            3
        );
        addOpcodeForOperator(
            'xor',
            0x11,
            SetOpcodes.opXor.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            2
        );
        addOpcodeForOperator(
            'or',
            0x13,
            SetOpcodes.opOr.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            2
        );

        addOpcodeForOperator(
            '+',
            0x26,
            SetOpcodes.opAdd.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            2
        );
        addOpcodeForOperator(
            '-',
            0x27,
            SetOpcodes.opSub.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            2
        );
        addOpcodeForOperator(
            '*',
            0x28,
            SetOpcodes.opMul.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            3
        );
        addOpcodeForOperator(
            '/',
            0x29,
            SetOpcodes.opDiv.selector,
            0x0,
            OpcodeLibNames.SetOpcodes,
            3
        );

        // Branching
        addOpcode(
            'ifelse',
            0x23,
            LogicalOpcodes.opIfelse.selector,
            IParser.asmIfelse.selector,
            OpcodeLibNames.LogicalOpcodes
        );
        addOpcode(
            'if',
            0x25,
            LogicalOpcodes.opIf.selector,
            IParser.asmIf.selector,
            OpcodeLibNames.LogicalOpcodes
        );
        addOpcode('end', 0x24, LogicalOpcodes.opEnd.selector, 0x0, OpcodeLibNames.LogicalOpcodes);

        // Simple Opcodes
        addOpcode(
            'blockNumber',
            0x15,
            OtherOpcodes.opBlockNumber.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'blockTimestamp',
            0x16,
            OtherOpcodes.opBlockTimestamp.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'blockChainId',
            0x17,
            OtherOpcodes.opBlockChainId.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'bool',
            0x18,
            OtherOpcodes.opBool.selector,
            IParser.asmBool.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'uint256',
            0x1a,
            OtherOpcodes.opUint256.selector,
            IParser.asmUint256.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'msgSender',
            0x1d,
            OtherOpcodes.opMsgSender.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'sendEth',
            0x1e,
            OtherOpcodes.opSendEth.selector,
            IParser.asmSend.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'transfer',
            0x1f,
            OtherOpcodes.opTransfer.selector,
            IParser.asmTransfer.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'transferVar',
            0x2c,
            OtherOpcodes.opTransferVar.selector,
            IParser.asmTransferVar.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'transferFrom',
            0x20,
            OtherOpcodes.opTransferFrom.selector,
            IParser.asmTransferFrom.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'transferFromVar',
            0x2a,
            OtherOpcodes.opTransferFromVar.selector,
            IParser.asmTransferFromVar.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'setLocalBool',
            0x21,
            OtherOpcodes.opSetLocalBool.selector,
            IParser.asmSetLocalBool.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'setLocalUint256',
            0x2d,
            OtherOpcodes.opSetLocalUint256.selector,
            IParser.asmSetLocalUint256.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'setUint256',
            0x2e,
            OtherOpcodes.opSetUint256.selector,
            IParser.asmSetUint256.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'msgValue',
            0x22,
            OtherOpcodes.opMsgValue.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'balanceOf',
            0x2b,
            OtherOpcodes.opBalanceOf.selector,
            IParser.asmBalanceOf.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Complex Opcodes with sub Opcodes (branches)
        string memory name = 'loadLocal';
        addOpcode(
            name,
            0x1b,
            OtherOpcodes.opLoadLocalAny.selector,
            IParser.asmLoadLocal.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadLocalUint256.selector);
        addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadLocalBool.selector);
        addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadLocalAddress.selector);
        addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadLocalBytes32.selector);

        name = 'loadRemote';
        addOpcode(
            name,
            0x1c,
            OtherOpcodes.opLoadRemoteAny.selector,
            IParser.asmLoadRemote.selector,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadRemoteUint256.selector);
        addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadRemoteBool.selector);
        addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadRemoteAddress.selector);
        addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadRemoteBytes32.selector);
    }

    function operatorsLen() external view returns (uint256) {
        return operators.length;
    }

    function setComparatorOpcodesAddr(address _comparatorOpcodes) public {
        comparatorOpcodes = _comparatorOpcodes;
    }

    function setLogicalOpcodesAddr(address _logicalOpcodes) public {
        logicalOpcodes = _logicalOpcodes;
    }

    function setSetOpcodesAddr(address _setOpcodes) public {
        setOpcodes = _setOpcodes;
    }

    function setOtherOpcodesAddr(address _otherOpcodes) public {
        otherOpcodes = _otherOpcodes;
    }

    function addOpcode(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector,
        OpcodeLibNames _libName
    ) public {
        require(_opSelector != bytes4(0), 'Context: empty opcode selector');
        require(
            opCodeByName[_name] == bytes1(0) && selectorByOpcode[_opcode] == bytes4(0),
            'Context: duplicate opcode name or code'
        );
        opCodeByName[_name] = _opcode;
        selectorByOpcode[_opcode] = _opSelector;
        opcodeLibNameByOpcode[_opcode] = _libName;
        asmSelectors[_name] = _asmSelector;
    }

    function addOpcodeForOperator(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector,
        OpcodeLibNames _libName,
        uint256 _priority
    ) internal {
        addOpcode(_name, _opcode, _opSelector, _asmSelector, _libName);
        addOperator(_name, _priority);
    }

    function addOpcodeBranch(
        string memory _baseOpName,
        string memory _branchName,
        bytes1 _branchCode,
        bytes4 _selector
    ) internal {
        require(_selector != bytes4(0), 'Context: empty opcode selector');
        require(
            branchSelectors[_baseOpName][_branchCode] == bytes4(0) &&
                branchCodes[_baseOpName][_branchName] == bytes1(0),
            'Context: duplicate opcode branch'
        );
        branchSelectors[_baseOpName][_branchCode] = _selector;
        branchCodes[_baseOpName][_branchName] = _branchCode;
    }

    // Note: bigger number => bigger priority
    function addOperator(string memory _op, uint256 _priority) internal {
        opsPriors[_op] = _priority;
        operators.push(_op);
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
