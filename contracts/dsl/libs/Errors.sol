// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// import 'hardhat/console.sol';

/**
 * @title List of Agreement errors
 */
library ErrorsAgreement {
    string constant AGR1 = 'AGR1'; // Agreement: bad record signatory
    string constant AGR2 = 'AGR2'; // Agreement: not all required records are executed
    string constant AGR3 = 'AGR3'; // Agreement: record fulfilment error
    string constant AGR4 = 'AGR4'; // Agreement: signatures are invalid
    string constant AGR5 = 'AGR5'; // Agreement: The transaction should have at least one condition
    string constant AGR6 = 'AGR6'; // Agreement: not all record conditions are satisfied
    string constant AGR7 = 'AGR7'; // Agreement: record already was executed by this signatory
}

/**
 * @title List of Context errors
 */
library ErrorsContext {
    string constant CTX1 = 'CTX1'; // Context: address is zero
    string constant CTX2 = 'CTX2'; // Context: empty opcode selector
    string constant CTX3 = 'CTX3'; // Context: duplicate opcode name or code
    string constant CTX4 = 'CTX4'; // Context: slicing out of range
    string constant CTX5 = 'CTX5'; // Context: duplicate opcode branch
}

/**
 * @title List of Stack errors
 */
library ErrorsStack {
    string constant STK1 = 'STK1'; // Stack: uint256 type mismatch
    string constant STK2 = 'STK2'; // Stack: string type mismatch
    string constant STK3 = 'STK3'; // Stack: address type mismatch
    string constant STK4 = 'STK4'; // Stack: stack is empty
}

/**
 * @title List of OtherOpcodes errors
 */
library ErrorsGeneralOpcodes {
    string constant OP1 = 'OP1'; // Opcodes: opSetLocal call not success
    string constant OP3 = 'OP3'; // Opcodes: opLoadRemote call not success
    string constant OP5 = 'OP5'; // Opcodes: opLoadLocal call not success
}

/**
 * @title List of Parser errors
 */
library ErrorsParser {
    string constant PRS1 = 'PRS1'; // Parser: delegatecall to asmSelector faile
    string constant PRS2 = 'PRS2'; // Parser: the name of variable can not be empty
}

/**
 * @title List of Preprocessor errors
 */
library ErrorsPreprocessor {
    string constant PRP1 = 'PRP1'; // Preprocessor: amount of parameters can not be 0
    string constant PRP2 = 'PRP2'; // Preprocessor: invalid parameters for the function
}

/**
 * @title List of OpcodesHelpers errors
 */
library ErrorsOpcodeHelpers {
    string constant OPH1 = 'OPH1'; // Opcodes: mustCall call not success
}

/**
 * @title List of ByteUtils errors
 */
library ErrorsByteUtils {
    string constant BUT1 = 'BUT1'; // ByteUtils: 'end' index must be greater than 'start'
    string constant BUT2 = 'BUT2'; // ByteUtils: 'end' is greater than the length of the array
}

/**
 * @title List of Executor errors
 */
library ErrorsExecutor {
    string constant EXC1 = 'EXC1'; // Executor: empty program
    string constant EXC2 = 'EXC2'; // Executor: did not find selector for opcode
    string constant EXC3 = 'EXC3'; // Executor: call not success
}

/**
 * @title List of StringUtils errors
 */
library ErrorsStringUtils {
    string constant SUT1 = 'SUT1'; // StringUtils: index out of range
    string constant SUT2 = 'SUT2'; // StringUtils: hex lenght not even
    string constant SUT3 = 'SUT3'; // StringUtils: non-decimal character
    string constant SUT4 = 'SUT4'; // StringUtils: base was not provided
    string constant SUT5 = 'SUT5'; // StringUtils: invalid format
    string constant SUT6 = 'SUT6'; // StringUtils: decimals were not provided
    string constant SUT7 = 'SUT7'; // StringUtils: a string was not provided
    string constant SUT8 = 'SUT8'; // StringUtils: a hex value not from the range 0-9, a-f, A-F
    string constant SUT9 = 'SUT9'; // StringUtils: base was not provided
}
