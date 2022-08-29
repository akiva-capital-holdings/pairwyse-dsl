// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { Stack } from './helpers/Stack.sol';
import { Array } from './helpers/Array.sol';
import { ComparisonOpcodes } from './libs/opcodes/ComparisonOpcodes.sol';
import { BranchingOpcodes } from './libs/opcodes/BranchingOpcodes.sol';
import { LogicalOpcodes } from './libs/opcodes/LogicalOpcodes.sol';
import { OtherOpcodes } from './libs/opcodes/OtherOpcodes.sol';
import { ErrorsContext } from './libs/Errors.sol';

import 'hardhat/console.sol';

/**
 * @dev Preprocessor of DSL code
 *
 * One of the core contracts of the project. It contains opcodes and aliases for commands.
 * It provides additional information about program state and point counter (pc).
 * Each of command that is provided by the Parser contract is processed in the Context contract
 */
contract Context is IContext {
    // stack is used by Opcode libraries like `libs/opcodes/*`
    // to store and analyze values and removing after usage
    Stack public stack;
    Array public array;
    bytes public program; // the bytecode of a program that is provided by Parser (will be removed)
    uint256 public pc; // point counter shows what the part of command are in proccess now
    uint256 public nextpc;
    address public appAddr; // address of end application. Is used to get variables stored in end application contract
    address public msgSender;
    address public comparisonOpcodes; // an address for ComparisonOpcodes library, can be changed
    address public branchingOpcodes; // an address for BranchingOpcodes library, can be changed
    address public logicalOpcodes; // an address for LogicalOpcodes library (AND, OR, XOR), can be changed
    address public otherOpcodes; // an address for OtherOpcodes library, can be changed
    uint256 public msgValue;

    mapping(string => bytes1) public opCodeByName; // name => opcode (hex)
    mapping(bytes1 => bytes4) public selectorByOpcode; // opcode (hex) => selector (hex)
    // emun OpcodeLibNames {...} from IContext
    // Depending on the hex value, it will take the proper
    // library from the OpcodeLibNames enum check the library for each opcode
    // where the opcode adds to the Context contract
    mapping(bytes1 => OpcodeLibNames) public opcodeLibNameByOpcode;
    // if the command is complex and uses `asm functions` then it will store
    // the selector of the usage function from the Parser for that opcode.
    // Each opcode that was added to the context should contain the selector otherwise
    // it should be set by 0x0
    mapping(string => bytes4) public asmSelectors; // command => selector
    mapping(string => uint256) public opsPriors; // stores the priority for operators
    string[] public operators;
    // baseOpName -> branchCode -> selector
    mapping(string => mapping(bytes1 => bytes4)) public branchSelectors;
    // baseOpName -> branchName -> branchCode
    mapping(string => mapping(string => bytes1)) public branchCodes;
    // alias -> base command
    mapping(string => string) public aliases;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), ErrorsContext.CTX1);
        _;
    }

    constructor() {
        stack = new Stack();
        array = new Array();
        initOpcodes();
    }

    function initOpcodes() internal {
        // Opcodes for operators
        _addOpcodeForOperator(
            '==',
            0x01,
            ComparisonOpcodes.opEq.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );
        _addOpcodeForOperator(
            '!=',
            0x14,
            ComparisonOpcodes.opNotEq.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );
        _addOpcodeForOperator(
            '<',
            0x03,
            ComparisonOpcodes.opLt.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );
        _addOpcodeForOperator(
            '>',
            0x04,
            ComparisonOpcodes.opGt.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );
        _addOpcodeForOperator(
            '<=',
            0x06,
            ComparisonOpcodes.opLe.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );
        _addOpcodeForOperator(
            '>=',
            0x07,
            ComparisonOpcodes.opGe.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );
        _addOpcodeForOperator(
            'swap',
            0x05,
            ComparisonOpcodes.opSwap.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            3
        );
        _addOpcodeForOperator(
            '!',
            0x02,
            ComparisonOpcodes.opNot.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            4
        );

        _addOpcodeForOperator(
            'and',
            0x12,
            LogicalOpcodes.opAnd.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            3
        );
        _addOpcodeForOperator(
            'xor',
            0x11,
            LogicalOpcodes.opXor.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );
        _addOpcodeForOperator(
            'or',
            0x13,
            LogicalOpcodes.opOr.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );

        _addOpcodeForOperator(
            '+',
            0x26,
            LogicalOpcodes.opAdd.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );
        _addOpcodeForOperator(
            '-',
            0x27,
            LogicalOpcodes.opSub.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );
        _addOpcodeForOperator(
            '*',
            0x28,
            LogicalOpcodes.opMul.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            3
        );
        _addOpcodeForOperator(
            '/',
            0x29,
            LogicalOpcodes.opDiv.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            3
        );

        // Branching
        addOpcode(
            'ifelse',
            0x23,
            BranchingOpcodes.opIfelse.selector,
            IParser.asmIfelse.selector,
            OpcodeLibNames.BranchingOpcodes
        );
        addOpcode(
            'if',
            0x25,
            BranchingOpcodes.opIf.selector,
            IParser.asmIf.selector,
            OpcodeLibNames.BranchingOpcodes
        );
        addOpcode(
            'end',
            0x24,
            BranchingOpcodes.opEnd.selector,
            0x0,
            OpcodeLibNames.BranchingOpcodes
        );
        // 'branch' tag gets replaced with 'end' tag. So this is just another name of the 'end' tag
        addOpcode(
            'branch',
            0x2f,
            BranchingOpcodes.opEnd.selector,
            0x0,
            OpcodeLibNames.BranchingOpcodes
        );

        // Simple Opcodes
        addOpcode(
            'blockNumber',
            0x15,
            OtherOpcodes.opBlockNumber.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );
        addOpcode(
            'TIME',
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
        addOpcode(
            'func',
            0x30,
            BranchingOpcodes.opFunc.selector,
            IParser.asmFunc.selector,
            OpcodeLibNames.BranchingOpcodes
        );

        // Complex Opcodes with sub Opcodes (branches)

        /*
            Types usage examples of loadLocal and loadRemote commands:
                loadLocal uint256 NUMBER_STORED_VALUE
                loadRemote bool ADDRESS_STORED_VALUE 9A676e781A523b5d0C0e43731313A708CB607508

            Where `*_STORED_VALUE` parameters can be set by using `setLocalBool`
            or `setUint256` opcodes
        */
        string memory name = 'loadLocal';
        addOpcode(
            name,
            0x1b,
            OtherOpcodes.opLoadLocalAny.selector,
            IParser.asmLoadLocal.selector,
            OpcodeLibNames.OtherOpcodes
        );
        _addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadLocalUint256.selector);
        _addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadLocalBool.selector);
        _addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadLocalAddress.selector);
        _addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadLocalBytes32.selector);

        name = 'loadRemote';
        addOpcode(
            name,
            0x1c,
            OtherOpcodes.opLoadRemoteAny.selector,
            IParser.asmLoadRemote.selector,
            OpcodeLibNames.OtherOpcodes
        );
        _addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadRemoteUint256.selector);
        _addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadRemoteBool.selector);
        _addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadRemoteAddress.selector);
        _addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadRemoteBytes32.selector);

        name = 'loadArray';
        addOpcode(
            name,
            0x31,
            OtherOpcodes.opLoadArrayAny.selector,
            IParser.asmLoadArray.selector,
            OpcodeLibNames.OtherOpcodes
        );

        _addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadArrayUint256.selector);
        // _addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadArrayBool.selector);
        // _addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadArrayAddress.selector);
        // _addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadArrayBytes32.selector);

        // Aliases

        /*
            As the blockTimestamp is the current opcode the user can use TIME alias to
            simplify the DSL code string.
            Example of the base command:
                `blockTimestamp < loadLocal uint256 FUND_INVESTMENT_DATE`
            Example of the alias of the base command:
                `TIME < loadLocal uint256 FUND_INVESTMENT_DATE`
        */
        _addAlias('TIME', 'blockTimestamp');
    }

    /**
     * @dev Returns the amount of stored operators
     */
    function operatorsLen() external view returns (uint256) {
        return operators.length;
    }

    /**
     * @dev Sets the new address of the ComparisonOpcodes library
     * @param _comparisonOpcodes is the new address of the library
     */
    function setComparisonOpcodesAddr(address _comparisonOpcodes) public {
        comparisonOpcodes = _comparisonOpcodes;
    }

    /**
     * @dev Sets the new address of the BranchingOpcodes library
     * @param _branchingOpcodes is the new address of the library
     */
    function setBranchingOpcodesAddr(address _branchingOpcodes) public {
        branchingOpcodes = _branchingOpcodes;
    }

    /**
     * @dev Sets the new address of the LogicalOpcodes library
     * @param _logicalOpcodes is the new address of the library
     */
    function setLogicalOpcodesAddr(address _logicalOpcodes) public {
        logicalOpcodes = _logicalOpcodes;
    }

    /**
     * @dev Sets the new address of the OtherOpcodes library
     * @param _otherOpcodes is the new address of the library
     */
    function setOtherOpcodesAddr(address _otherOpcodes) public {
        otherOpcodes = _otherOpcodes;
    }

    /**
     * @dev Adds the opcode for the DSL command
     * @param _name is the name of the command
     * @param _opcode is the opcode of the command
     * @param _opSelector is the selector of the function for this opcode
       from onle of library in `contracts/libs/opcodes/*`
     * @param _asmSelector is the selector of the function from the Parser for that opcode
     * @param _libName is the name of library that is used fot the opcode
     */
    function addOpcode(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector,
        OpcodeLibNames _libName
    ) public {
        require(_opSelector != bytes4(0), ErrorsContext.CTX2);
        require(
            opCodeByName[_name] == bytes1(0) && selectorByOpcode[_opcode] == bytes4(0),
            ErrorsContext.CTX3
        );
        opCodeByName[_name] = _opcode;
        selectorByOpcode[_opcode] = _opSelector;
        opcodeLibNameByOpcode[_opcode] = _libName;
        asmSelectors[_name] = _asmSelector;
    }

    /**
     * @dev ATTENTION! Works only during development! Will be removed.
     * Sets the final version of the program.
     *
     * @param _data is the bytecode of the full program
     */
    function setProgram(bytes memory _data) public {
        program = _data;
        setPc(0);
    }

    /**
     * @dev Returns the slice of the current program using the index and the step values
     *
     * @param _index is a last byte of the slice
     * @param _step is the step of the slice
     * @return the slice of stored bytecode in the `program` variable
     */
    function programAt(uint256 _index, uint256 _step) public view returns (bytes memory) {
        bytes memory data = program;
        return this.programSlice(data, _index, _step);
    }

    /**
     * @dev Returns the slice of the program using a step value
     *
     * @param _payload is bytecode of program that will be sliced
     * @param _index is a last byte of the slice
     * @param _step is the step of the slice
     * @return the slice of provided _payload bytecode
     */
    function programSlice(
        bytes calldata _payload,
        uint256 _index,
        uint256 _step
    ) public pure returns (bytes memory) {
        require(_payload.length > _index, ErrorsContext.CTX4);
        return _payload[_index:_index + _step];
    }

    /**
     * @dev Sets the current point counter for the program
     *
     * @param _pc is the new value of the pc
     */
    function setPc(uint256 _pc) public {
        pc = _pc;
    }

    /**
     * @dev Sets the next point counter for the program
     *
     * @param _nextpc is the new value of the nextpc
     */
    function setNextPc(uint256 _nextpc) public {
        nextpc = _nextpc;
    }

    /**
     * @dev Increases the current point counter with the provided value and saves the sum
     *
     * @param _val is the new value that is used for summing it and the current pc value
     */
    function incPc(uint256 _val) public {
        pc += _val;
    }

    /**
     * @dev Sets/Updates application Address by the provided value
     *
     * @param _appAddr is the new application Address, can not be a zero address
     */
    function setAppAddress(address _appAddr) external nonZeroAddress(_appAddr) {
        appAddr = _appAddr;
    }

    /**
     * @dev Sets/Updates msgSender by the provided value
     *
     * @param _msgSender is the new msgSender
     */
    function setMsgSender(address _msgSender) public nonZeroAddress(_msgSender) {
        msgSender = _msgSender;
    }

    /**
     * @dev Sets/Updates msgValue by the provided value
     *
     * @param _msgValue is the new msgValue
     */
    function setMsgValue(uint256 _msgValue) public {
        msgValue = _msgValue;
    }

    /**
     * @dev Adds the opcode for the operator
     * @param _name is the name of the operator
     * @param _opcode is the opcode of the operator
     * @param _opSelector is the selector of the function for this operator
       from onle of library in `contracts/libs/opcodes/*`
     * @param _asmSelector is the selector of the function from the Parser for this operator
     * @param _libName is the name of library that is used fot the operator
     * @param _priority is the priority for the opcode
     */
    function _addOpcodeForOperator(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector,
        OpcodeLibNames _libName,
        uint256 _priority
    ) internal {
        addOpcode(_name, _opcode, _opSelector, _asmSelector, _libName);
        _addOperator(_name, _priority);
    }

    /**
     * @dev As branched (complex) DSL commands have their own name, types and values the
     * _addOpcodeBranch provides adding opcodes using additional internal branch opcodes.
     * @param _baseOpName is the name of the command
     * @param _branchName is the type for the value
     * @param _branchCode is the code for the certain name and its type
     * @param _selector is the selector of the function from the Parser for this command
     */
    function _addOpcodeBranch(
        string memory _baseOpName,
        string memory _branchName,
        bytes1 _branchCode,
        bytes4 _selector
    ) internal {
        require(_selector != bytes4(0), ErrorsContext.CTX2);
        require(
            branchSelectors[_baseOpName][_branchCode] == bytes4(0) &&
                branchCodes[_baseOpName][_branchName] == bytes1(0),
            ErrorsContext.CTX5
        );
        branchSelectors[_baseOpName][_branchCode] = _selector;
        branchCodes[_baseOpName][_branchName] = _branchCode;
    }

    /**
     * @dev Adds the operator by its priority
     * Note: bigger number => bigger priority
     *
     * @param _op is the name of the operator
     * @param _priority is the priority of the operator
     */
    function _addOperator(string memory _op, uint256 _priority) internal {
        opsPriors[_op] = _priority;
        operators.push(_op);
    }

    /**
     * @dev Adds an alias to the already existing DSL command
     *
     * @param _baseCmd is the name of the command
     * @param _alias is the alias command name for the base command
     */
    function _addAlias(string memory _baseCmd, string memory _alias) internal {
        aliases[_alias] = _baseCmd;
    }

    /**
     * @dev Sets/Updates addresses for the array
     */
    function setArrayAddresses(string memory _name, address[] memory _addresses) public {
        array.setArrayAddresses(_name, _addresses);
    }

    /**
     * @dev Get address by index
     */
    function getAddressByIndex(string memory _name, uint256 _index) public view returns (address) {
        return array.getAddressByIndex(_name, _index);
    }

    /**
     * @dev Get array fo the name for address
     */
    function getAddressArray(string memory _name) public view returns (address[] memory) {
        return array.getAddressArray(_name);
    }

    /**
     * @dev Sets/Updates addresses for the array
     */
    function setArrayUint256(string memory _name, uint256[] memory _values) public {
        array.setArrayUint256(_name, _values);
    }

    /**
     * @dev Get address by index
     */
    function getUint256ByIndex(string memory _name, uint256 _index) public view returns (uint256) {
        return array.getUint256ByIndex(_name, _index);
    }

    /**
     * @dev Get address by index
     */
    function getUint256ByIndex(string memory _name, bytes32 _index) public view returns (uint256) {
        console.log('--sdfs---');
        console.log(_name);
        console.log(_index);
        // return array.getUint256ByIndex(_name,  _index);
    }

    /**
     * @dev Get array fo the name for uint256
     */
    function getUin256Array(string memory _name) public view returns (uint256[] memory) {
        return array.getUint256Array(_name);
    }
}
