// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @title Set operator opcodes
 * @notice Opcodes for set operators such as AND, OR, XOR
 */
library LogicalOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     * @param _ctxProgram Context contract address
     */
    function opAnd(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, (prev > 0) && (last > 0) ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     * @param _ctxProgram Context contract address
     */
    function opOr(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, (prev > 0) || (last > 0) ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if the values ​
     * ​are different and 0 if they are the same
     * @param _ctxProgram Context contract address
     */
    function opXor(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(
            _ctxProgram,
            ((prev > 0) && (last == 0)) || ((prev == 0) && (last > 0)) ? 1 : 0
        );
    }

    /**
     * @dev Add two values and put result in the stack.
     * @param _ctxProgram Context contract address
     */
    function opAdd(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, prev + last);
    }

    /**
     * @dev Subtracts one value from enother and put result in the stack.
     * @param _ctxProgram Context contract address
     */
    function opSub(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, prev - last);
    }

    /**
     * @dev Multiplies values and put result in the stack.
     * @param _ctxProgram Context contract address
     */
    function opMul(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, prev * last);
    }

    /**
     * Divide two numbers from the top of the stack
     * @dev This is an integer division. Example: 5 / 2 = 2
     * @param _ctxProgram Context address
     */
    function opDiv(address _ctxProgram, address) public {
        uint256 last = IProgramContext(_ctxProgram).stack().pop();
        uint256 prev = IProgramContext(_ctxProgram).stack().pop();
        OpcodeHelpers.putToStack(_ctxProgram, prev / last);
    }
}
