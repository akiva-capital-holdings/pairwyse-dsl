// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IProgramContext } from './interfaces/IProgramContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { IStorageUniversal } from './interfaces/IStorageUniversal.sol';
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
 * One of the core contracts of the project. It provides additional information about
 * program state and point counter (pc).
 */
contract ProgramContext is IProgramContext {
    // The address that is used to symbolyze any signer inside Conditional Transaction
    address public constant ANYONE = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
    address public appAddr; // address of end application.

    // stack is used by Opcode libraries like `libs/opcodes/*`
    // to store and analyze values and removing after usage
    Stack public stack;
    bytes public program; // the bytecode of a program that is provided by Parser (will be removed)
    uint256 public pc; // point counter shows what the part of command are in proccess now
    uint256 public nextpc;
    address public msgSender;
    uint256 public msgValue;

    mapping(string => bool) public isStructVar;
    mapping(bytes4 => mapping(bytes4 => bytes4)) public structParams;
    // Counter for the number of iterations for every for-loop in DSL code
    uint256 public forLoopIterationsRemaining;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), ErrorsContext.CTX1);
        _;
    }

    modifier onlyApp() {
        require(msg.sender != appAddr, ErrorsContext.CTX6);
        _;
    }

    constructor() {
        stack = new Stack();
        appAddr = msg.sender;
    }

    /**
     * @dev ATTENTION! Works only during development! Will be removed.
     * Sets the final version of the program.
     * @param _data is the bytecode of the full program
     */
    function setProgram(bytes memory _data) public onlyApp {
        program = _data;
        setPc(0);
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
     * @dev Returns the slice of the current program using the index and the step values
     * @return the slice of stored bytecode in the `program` variable
     */
    function currentProgram() public view returns (bytes memory) {
        // program, index, step
        return this.programSlice(program, pc, 1);
    }

    /**
     * @dev Sets the current point counter for the program
     * @param _pc is the new value of the pc
     */
    function setPc(uint256 _pc) public {
        pc = _pc;
    }

    /**
     * @dev Sets the next point counter for the program
     * @param _nextpc is the new value of the nextpc
     */
    function setNextPc(uint256 _nextpc) public {
        nextpc = _nextpc;
    }

    /**
     * @dev Increases the current point counter with the provided value and saves the sum
     * @param _val is the new value that is used for summing it and the current pc value
     */
    function incPc(uint256 _val) public {
        pc += _val;
    }

    /**
     * @dev Sets/Updates msgSender by the provided value
     * @param _msgSender is the new msgSender
     */
    function setMsgSender(address _msgSender) public nonZeroAddress(_msgSender) {
        msgSender = _msgSender;
    }

    /**
     * @dev Sets/Updates msgValue by the provided value
     * @param _msgValue is the new msgValue
     */
    function setMsgValue(uint256 _msgValue) public {
        msgValue = _msgValue;
    }

    /**
     * @dev Sets the full name depends on structure variables
     * @param _structName is the name of the structure
     * @param _varName is the name of the structure variable
     * @param _fullName is the full string of the name of the structure and its variables
     */
    function setStructVars(
        string memory _structName,
        string memory _varName,
        string memory _fullName
    ) public {
        isStructVar[_fullName] = true;
        bytes4 structName = bytes4(keccak256(abi.encodePacked(_structName)));
        bytes4 varName = bytes4(keccak256(abi.encodePacked(_varName)));
        bytes4 fullName = bytes4(keccak256(abi.encodePacked(_fullName)));
        structParams[structName][varName] = fullName;
    }

    /**
     * @dev Sets the number of iterations for the for-loop that is being executed
     * @param _forLoopIterationsRemaining The number of iterations of the loop
     */
    function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external {
        forLoopIterationsRemaining = _forLoopIterationsRemaining;
    }
}
