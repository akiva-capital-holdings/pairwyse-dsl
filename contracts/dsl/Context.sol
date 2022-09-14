// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { Stack } from './helpers/Stack.sol';
import { ComparisonOpcodes } from './libs/opcodes/ComparisonOpcodes.sol';
import { BranchingOpcodes } from './libs/opcodes/BranchingOpcodes.sol';
import { LogicalOpcodes } from './libs/opcodes/LogicalOpcodes.sol';
import { OtherOpcodes } from './libs/opcodes/OtherOpcodes.sol';
import { ErrorsContext } from './libs/Errors.sol';

// import 'hardhat/console.sol';

/**
 * @dev Context of DSL code
 *
 * One of the core contracts of the project. It contains opcodes and aliases for commands.
 * It provides additional information about program state and point counter (pc).
 * During creating Context contract executes the `initOpcodes` function that provides
 * basic working opcodes
 */
contract Context is IContext {
    // The address that is used to symbolyze any signer inside Conditional Transaction
    address public constant anyone = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
    // mapping(string => bytes32) public arrays;
    // mapping(string => bool) public isArray;

    // stack is used by Opcode libraries like `libs/opcodes/*`
    // to store and analyze values and removing after usage
    Stack public stack;
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
        initOpcodes();
    }

    /**
     * @dev Creates a list of opcodes and its aliases with information about each of them:
     * - name
     * - selectors of opcode functions,
     * - used library for each of opcode for Executor contract
     * - asm selector of function that uses in Parser contract
     * Function contains simple opcodes as arithmetic, comparison and bitwise. In additional to that
     * it contains complex opcodes that can load data (variables with different types) from memory
     * and helpers like transfer tokens or native coins to the address or opcodes branching and internal
     * DSL functions.
     */
    function initOpcodes() internal {
        // Opcodes for operators

        // Ex. `a == b`
        _addOpcodeForOperator(
            '==',
            0x01,
            ComparisonOpcodes.opEq.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );

        // Ex. `a != b`
        _addOpcodeForOperator(
            '!=',
            0x14,
            ComparisonOpcodes.opNotEq.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );

        // Ex. `a < b`
        _addOpcodeForOperator(
            '<',
            0x03,
            ComparisonOpcodes.opLt.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );

        // Ex. `a > b`
        _addOpcodeForOperator(
            '>',
            0x04,
            ComparisonOpcodes.opGt.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );

        // Ex. `a <= b`
        _addOpcodeForOperator(
            '<=',
            0x06,
            ComparisonOpcodes.opLe.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );

        // Ex. `a >= b`
        _addOpcodeForOperator(
            '>=',
            0x07,
            ComparisonOpcodes.opGe.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            1
        );

        // Changes swaps two values. Ex. `a swap b`
        // TODO: add more tests
        _addOpcodeForOperator(
            'swap',
            0x05,
            ComparisonOpcodes.opSwap.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            3
        );

        // Used to reverse the logical state of its operand. Ex. `!a` or `!(a and b)`
        _addOpcodeForOperator(
            '!',
            0x02,
            ComparisonOpcodes.opNot.selector,
            0x0,
            OpcodeLibNames.ComparisonOpcodes,
            4
        );

        // If both the operands are true then condition becomes true. Ex. `a and b`
        _addOpcodeForOperator(
            'and',
            0x12,
            LogicalOpcodes.opAnd.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            3
        );

        // It copies the bit if it is set in one operand but not both. Ex. `a xor b`
        _addOpcodeForOperator(
            'xor',
            0x11,
            LogicalOpcodes.opXor.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );

        // It copies a bit if it exists in either operand. Ex. `a or b`
        _addOpcodeForOperator(
            'or',
            0x13,
            LogicalOpcodes.opOr.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );

        // Ex. `a + b`
        _addOpcodeForOperator(
            '+',
            0x26,
            LogicalOpcodes.opAdd.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );

        // Ex. `a - b`
        _addOpcodeForOperator(
            '-',
            0x27,
            LogicalOpcodes.opSub.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            2
        );

        // Ex. `a * b`
        _addOpcodeForOperator(
            '*',
            0x28,
            LogicalOpcodes.opMul.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            3
        );

        // Ex. `a / b`
        _addOpcodeForOperator(
            '/',
            0x29,
            LogicalOpcodes.opDiv.selector,
            0x0,
            OpcodeLibNames.LogicalOpcodes,
            3
        );

        // Branching

        /**
            bool true
            ifelse D E
                uint2567 7000
            end

            D {
                uint2567 0
            }
            E {
                uint2567 7000 + uint2567 1
            }
        */
        addOpcode(
            'ifelse',
            0x23,
            BranchingOpcodes.opIfelse.selector,
            IParser.asmIfelse.selector,
            OpcodeLibNames.BranchingOpcodes
        );

        /**
            bool true
            if C
            end

            C {
                ${FIVE}
            }
        */
        addOpcode(
            'if',
            0x25,
            BranchingOpcodes.opIf.selector,
            IParser.asmIf.selector,
            OpcodeLibNames.BranchingOpcodes
        );

        /**
            Ends the block of if/ifelse/func opcodes description
            Example: using with func opcode
            ```
            func SUM_OF_NUMBERS endf
            end

            SUM_OF_NUMBERS {
                (6 + 8) setUint256 SUM
            }
            ```
        */
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

        // Current block timestamp as seconds since unix epoch. Ex. `TIME <= FUTURE_TIME_VARIABLE`
        addOpcode(
            'TIME',
            0x16,
            OtherOpcodes.opBlockTimestamp.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );

        // Current chain id. Ex. `blockChainId == 123`
        addOpcode(
            'blockChainId',
            0x17,
            OtherOpcodes.opBlockChainId.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `bool true`
        addOpcode(
            'bool',
            0x18,
            OtherOpcodes.opBool.selector,
            IParser.asmBool.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `uint256 567`
        addOpcode(
            'uint256',
            0x1a,
            OtherOpcodes.opUint256.selector,
            IParser.asmUint256.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `msgSender != 0x0000000000000000000000000000000000000000`
        addOpcode(
            'msgSender',
            0x1d,
            OtherOpcodes.opMsgSender.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `sendEth ETH_RECEIVER 1000000000000000000`
        addOpcode(
            'sendEth',
            0x1e,
            OtherOpcodes.opSendEth.selector,
            IParser.asmSend.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `transfer TOKEN_ADDR TOKEN_RECEIVER 10`
        addOpcode(
            'transfer',
            0x1f,
            OtherOpcodes.opTransfer.selector,
            IParser.asmTransfer.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `transferVar DAI RECEIVER AMOUNT`
        // TODO: add more tests
        addOpcode(
            'transferVar',
            0x2c,
            OtherOpcodes.opTransferVar.selector,
            IParser.asmTransferVar.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `transferFrom DAI OWNER RECEIVER 10`
        // TODO: add more tests
        addOpcode(
            'transferFrom',
            0x20,
            OtherOpcodes.opTransferFrom.selector,
            IParser.asmTransferFrom.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `transferFromVar DAI OWNER RECEIVER AMOUNT`
        // TODO: add more tests
        addOpcode(
            'transferFromVar',
            0x2a,
            OtherOpcodes.opTransferFromVar.selector,
            IParser.asmTransferFromVar.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `setLocalBool BOOLVAR true`
        addOpcode(
            'setLocalBool',
            0x21,
            OtherOpcodes.opSetLocalBool.selector,
            IParser.asmSetLocalBool.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `(4 + 17) setUint256 VAR`
        addOpcode(
            'setUint256',
            0x2e,
            OtherOpcodes.opSetUint256.selector,
            IParser.asmSetUint256.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // TODO: need more examples and test how we can use it internally
        addOpcode(
            'msgValue',
            0x22,
            OtherOpcodes.opMsgValue.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes
        );

        // Ex. `balanceOf DAI USER`
        addOpcode(
            'balanceOf',
            0x2b,
            OtherOpcodes.opBalanceOf.selector,
            IParser.asmBalanceOf.selector,
            OpcodeLibNames.OtherOpcodes
        );

        /** Example:
            func SUM_OF_NUMBERS endf
            end

            SUM_OF_NUMBERS {
                (6 + 8) setUint256 SUM
            }
        */
        addOpcode(
            'func',
            0x30,
            BranchingOpcodes.opFunc.selector,
            IParser.asmFunc.selector,
            OpcodeLibNames.BranchingOpcodes
        );

        // Ex. `declare BALANCES`
        addOpcode(
            'declare',
            0x31,
            OtherOpcodes.opDeclare.selector,
            IParser.asmDeclare.selector,
            OpcodeLibNames.OtherOpcodes
        );

        // Complex Opcodes with sub Opcodes (branches)

        /*
            Types usage examples of loadLocal and loadRemote opcodes:
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
        // types that 'loadLocal' have for loading data
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
        // types that 'loadRemote' have for loading data
        _addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadRemoteUint256.selector);
        _addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadRemoteBool.selector);
        _addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadRemoteAddress.selector);
        _addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadRemoteBytes32.selector);

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

    // /**
    //  * @dev Get position of the array by its name
    //  */
    // function getArrayPosition(string memory _name) public returns(bytes32) {
    //     return arrays[_name];
    // }

    // *
    //  * @dev Set position of the array by its name

    // function setArrayPosition(string memory _name, bytes32 _position) public {
    //     arrays[_name] = _position;
    // }
}
