// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from './interfaces/IDSLContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { IStorageUniversal } from './interfaces/IStorageUniversal.sol';
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
 * During creating Context contract executes the `initOpcodes` function that provides
 * basic working opcodes
 */
contract DSLContext is IDSLContext {
    address public comparisonOpcodes; // an address for ComparisonOpcodes library, can be changed
    address public branchingOpcodes; // an address for BranchingOpcodes library, can be changed
    address public logicalOpcodes; // an address for LogicalOpcodes library (AND, OR, XOR), can be changed
    address public otherOpcodes; // an address for OtherOpcodes library, can be changed

    mapping(string => bytes1) public opCodeByName; // name => opcode (hex)
    mapping(bytes1 => bytes4) public selectorByOpcode; // opcode (hex) => selector (hex)
    mapping(string => uint8) public numOfArgsByOpcode; // opcode name => number of arguments
    mapping(string => bool) public isCommand; // opcode name => is opcode a command (command = !(math operator))
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

    constructor(
        address _comparisonOpcodes,
        address _branchingOpcodes,
        address _logicalOpcodes,
        address _otherOpcodes
    ) {
        require(
            _comparisonOpcodes != address(0) &&
                _branchingOpcodes != address(0) &&
                _logicalOpcodes != address(0) &&
                _otherOpcodes != address(0),
            ErrorsContext.CTX1
        );

        initOpcodes();

        comparisonOpcodes = _comparisonOpcodes;
        branchingOpcodes = _branchingOpcodes;
        logicalOpcodes = _logicalOpcodes;
        otherOpcodes = _otherOpcodes;
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
        _addOpcode(
            'ifelse',
            0x23,
            BranchingOpcodes.opIfelse.selector,
            IParser.asmIfelse.selector,
            OpcodeLibNames.BranchingOpcodes,
            2,
            true
        );

        /**
            bool true
            if C
            end

            C {
                ${FIVE}
            }
        */
        _addOpcode(
            'if',
            0x25,
            BranchingOpcodes.opIf.selector,
            IParser.asmIf.selector,
            OpcodeLibNames.BranchingOpcodes,
            1,
            true
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
        _addOpcode(
            'end',
            0x24,
            BranchingOpcodes.opEnd.selector,
            0x0,
            OpcodeLibNames.BranchingOpcodes,
            0,
            true
        );

        // Simple Opcodes
        _addOpcode(
            'blockNumber',
            0x15,
            OtherOpcodes.opBlockNumber.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes,
            0,
            true
        );

        // Current block timestamp as seconds since unix epoch. Ex. `time <= FUTURE_TIME_VARIABLE`
        _addOpcode(
            'time',
            0x16,
            OtherOpcodes.opBlockTimestamp.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes,
            0,
            true
        );

        // Current chain id. Ex. `blockChainId == 123`
        _addOpcode(
            'blockChainId',
            0x17,
            OtherOpcodes.opBlockChainId.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes,
            0,
            true
        );

        // Ex. `bool true`
        _addOpcode(
            'bool',
            0x18,
            OtherOpcodes.opBool.selector,
            IParser.asmBool.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        // Ex. `uint256 567`
        _addOpcode(
            'uint256',
            0x1a,
            OtherOpcodes.opUint256.selector,
            IParser.asmUint256.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        // Ex. `msgSender != 0x0000000000000000000000000000000000000000`
        _addOpcode(
            'msgSender',
            0x1d,
            OtherOpcodes.opMsgSender.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes,
            0,
            true
        );

        // Ex. `sendEth ETH_RECEIVER 1000000000000000000`
        _addOpcode(
            'sendEth',
            0x1e,
            OtherOpcodes.opSendEth.selector,
            IParser.asmSend.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );

        // Ex. `transfer TOKEN_ADDR TOKEN_RECEIVER 10`
        _addOpcode(
            'transfer',
            0x1f,
            OtherOpcodes.opTransfer.selector,
            IParser.asmTransfer.selector,
            OpcodeLibNames.OtherOpcodes,
            3,
            true
        );

        // Ex. `transferVar DAI RECEIVER AMOUNT`
        _addOpcode(
            'transferVar',
            0x2c,
            OtherOpcodes.opTransferVar.selector,
            IParser.asmTransferVar.selector,
            OpcodeLibNames.OtherOpcodes,
            3,
            true
        );

        // Ex. `transferFrom DAI OWNER RECEIVER 10`
        _addOpcode(
            'transferFrom',
            0x20,
            OtherOpcodes.opTransferFrom.selector,
            IParser.asmTransferFrom.selector,
            OpcodeLibNames.OtherOpcodes,
            4,
            true
        );

        // Ex. `transferFromVar DAI OWNER RECEIVER AMOUNT`
        _addOpcode(
            'transferFromVar',
            0x2a,
            OtherOpcodes.opTransferFromVar.selector,
            IParser.asmTransferFromVar.selector,
            OpcodeLibNames.OtherOpcodes,
            4,
            true
        );

        // Ex. `setLocalBool BOOLVAR true`
        _addOpcode(
            'setLocalBool',
            0x21,
            OtherOpcodes.opSetLocalBool.selector,
            IParser.asmSetLocalBool.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );

        // Ex. `(4 + 17) setUint256 VAR`
        _addOpcode(
            'setUint256',
            0x2e,
            OtherOpcodes.opSetUint256.selector,
            IParser.asmSetUint256.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        // Ex. (msgValue == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) setBool IS_OWNER
        _addOpcode(
            'msgValue',
            0x22,
            OtherOpcodes.opMsgValue.selector,
            0x0,
            OpcodeLibNames.OtherOpcodes,
            0,
            true
        );

        // Ex. `balanceOf DAI USER`
        _addOpcode(
            'balanceOf',
            0x2b,
            OtherOpcodes.opBalanceOf.selector,
            IParser.asmBalanceOf.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );

        /** Example:
            func SUM_OF_NUMBERS endf
            end

            SUM_OF_NUMBERS {
                (6 + 8) setUint256 SUM
            }
        */
        _addOpcode(
            'func',
            0x30,
            BranchingOpcodes.opFunc.selector,
            IParser.asmFunc.selector,
            OpcodeLibNames.BranchingOpcodes,
            0, // actually can be any number of params
            true
        );

        // Push to array
        // Ex. `push 0xe7f8a90ede3d84c7c0166bd84a4635e4675accfc USERS`
        _addOpcode(
            'push',
            0x33,
            OtherOpcodes.opPush.selector,
            IParser.asmPush.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );

        // Get length of array
        // Ex. `lengthOf PARTNERS`
        _addOpcode(
            'lengthOf',
            0x34,
            OtherOpcodes.opLengthOf.selector,
            IParser.asmLengthOf.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        // Get element by index in the array
        // Ex. `get 3 USERS`
        _addOpcode(
            'get',
            0x35,
            OtherOpcodes.opGet.selector,
            IParser.asmGet.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );

        // Sums all elements in an array
        // Ex. `sumOf ARR_NAME`
        _addOpcode(
            'sumOf',
            0x40,
            OtherOpcodes.opSumOf.selector,
            IParser.asmSumOf.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        /* Sums struct variables values from the `struct type` array
            Ex. `sumThroughStructs ARR_NAME STRUCT_VARIABLE_NAME`

            For more info see command `declareArr struct`
            Usage:
                struct Bob { // declare the first struct
                  lastPayment: 1000
                }

                struct Mary { // declare the second struct
                  lastPayment: 2000
                }

                // declare the array that have type `struct`
                declareArr struct USERS

                // insert `Bob` name into `USERS` array,
                push Bob USERS

                // or use `insert` DSL command by inserting `Bob` name into `USERS` array
                insert Mary into USERS

                // usage of a `sumThroughStructs` command sums 1000 and 2000 and save to the stack
                sumThroughStructs USERS lastPayment

                // or command bellow will be preprocessed to the same `sumThroughStructs` format
                sumOf USERS.lastPayment
        */
        _addOpcode(
            'sumThroughStructs',
            0x38,
            OtherOpcodes.opSumThroughStructs.selector,
            IParser.asmSumThroughStructs.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );

        // Creates structs
        // Ex. `struct BOB { address: 0x123...456, lastDeposit: 3 }`
        // Ex. `BOB.lastDeposit >= 5`
        _addOpcode(
            'struct',
            0x36,
            OtherOpcodes.opStruct.selector,
            IParser.asmStruct.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        /************
         * For loop *
         ***********/
        // start of the for-loop
        // Ex.
        // ```
        // for USER in USERS {
        //   sendEth USER 1e18
        // }
        // ```
        _addOpcode(
            'for',
            0x37,
            BranchingOpcodes.opForLoop.selector,
            IParser.asmForLoop.selector,
            OpcodeLibNames.BranchingOpcodes,
            3,
            true
        );

        // internal opcode that is added automatically by Preprocessor
        // indicates the start of the for-loop block
        _addOpcode(
            'startLoop',
            0x32,
            BranchingOpcodes.opStartLoop.selector,
            0x0,
            OpcodeLibNames.BranchingOpcodes,
            0,
            true
        );

        // indicates the end of the for-loop block
        _addOpcode(
            'endLoop',
            0x39,
            BranchingOpcodes.opEndLoop.selector,
            0x0,
            OpcodeLibNames.BranchingOpcodes,
            0,
            true
        );

        // Complex Opcodes with sub Opcodes (branches)

        /*
            Types usage examples of var and loadRemote opcodes:
                var NUMBER_STORED_VALUE
                loadRemote bool ADDRESS_STORED_VALUE 9A676e781A523b5d0C0e43731313A708CB607508

            Where `*_STORED_VALUE` parameters can be set by using `setLocalBool`
            or `setUint256` opcodes
        */
        _addOpcode(
            'var',
            0x1b,
            OtherOpcodes.opLoadLocalUint256.selector,
            IParser.asmVar.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        // Activates record in Aggreement contract by Record ID
        // Ex. `enableRecord 5 at 0x9A676e781A523b5d0C0e43731313A708CB607508`,
        // where 5 is a `Record ID`;
        // `0x9A676e781A523b5d0C0e43731313A708CB607508` is an Agreement address
        _addOpcode(
            'enableRecord',
            0x41,
            OtherOpcodes.opEnableRecord.selector,
            IParser.asmEnableRecord.selector,
            OpcodeLibNames.OtherOpcodes,
            1,
            true
        );

        string memory name = 'loadRemote';
        _addOpcode(
            name,
            0x1c,
            OtherOpcodes.opLoadRemoteAny.selector,
            IParser.asmLoadRemote.selector,
            OpcodeLibNames.OtherOpcodes,
            3,
            true
        );
        // types that 'loadRemote' have for loading data
        _addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadRemoteUint256.selector);
        _addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadRemoteBool.selector);
        _addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadRemoteAddress.selector);
        _addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadRemoteBytes32.selector);

        // Ex. `declareArr uint256 BALANCES`
        name = 'declareArr';
        _addOpcode(
            name,
            0x31,
            OtherOpcodes.opDeclare.selector,
            IParser.asmDeclare.selector,
            OpcodeLibNames.OtherOpcodes,
            2,
            true
        );
        // types of arrays for declaration
        _addOpcodeBranch(name, 'uint256', 0x01, IStorageUniversal.setStorageUint256.selector);
        _addOpcodeBranch(name, 'struct', 0x02, bytes4(0x0));
        _addOpcodeBranch(name, 'address', 0x03, IStorageUniversal.setStorageAddress.selector);

        /***********
         * Aliases *
         **********/

        /*
            As the blockTimestamp is the current opcode the user can use time alias to
            simplify the DSL code string.
            Example of the base command:
                `blockTimestamp < var FUND_INVESTMENT_DATE`
            Example of the alias of the base command:
                `time < var FUND_INVESTMENT_DATE`
        */
        // _addAlias(<original>, <alias>);
        _addAlias('time', 'blockTimestamp');
        _addAlias('end', 'branch');
        _addAlias('declareArr uint256', 'uint256[]');
        _addAlias('declareArr string', 'string[]');
        _addAlias('declareArr bytes32', 'bytes32[]');
        _addAlias('declareArr address', 'address[]');
        _addAlias('declareArr bool', 'bool[]');
        _addAlias('declareArr struct', 'struct[]');
    }

    /**
     * @dev Returns the amount of stored operators
     */
    function operatorsLen() external view returns (uint256) {
        return operators.length;
    }

    /**
     * @dev Adds the opcode for the DSL command
     * @param _name is the name of the command
     * @param _opcode is the opcode of the command
     * @param _opSelector is the selector of the function for this opcode
       from onle of library in `contracts/libs/opcodes/*`
     * @param _asmSelector is the selector of the function from the Parser for that opcode
     * @param _libName is the name of library that is used fot the opcode
     * @param _numOfArgs The number of arguments for this opcode
     */
    function _addOpcode(
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector,
        OpcodeLibNames _libName,
        uint8 _numOfArgs,
        bool _isCommand
    ) internal {
        require(_opSelector != bytes4(0), ErrorsContext.CTX2);
        require(
            opCodeByName[_name] == bytes1(0) && selectorByOpcode[_opcode] == bytes4(0),
            ErrorsContext.CTX3
        );
        opCodeByName[_name] = _opcode;
        selectorByOpcode[_opcode] = _opSelector;
        opcodeLibNameByOpcode[_opcode] = _libName;
        asmSelectors[_name] = _asmSelector;
        numOfArgsByOpcode[_name] = _numOfArgs;
        isCommand[_name] = _isCommand;
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
        _addOpcode(_name, _opcode, _opSelector, _asmSelector, _libName, 0, false);
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
        // TODO: will we use zero _selector in the future?
        // require(_selector != bytes4(0), ErrorsContext.CTX2);
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
}
