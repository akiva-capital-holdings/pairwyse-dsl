// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ComparisonOpcodes } from '../../libs/opcodes/ComparisonOpcodes.sol';

contract ComparisonOpcodesMock {
    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(address _ctxProgram, address) public {
        ComparisonOpcodes.opEq(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(address _ctxProgram, address) public {
        ComparisonOpcodes.opNotEq(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(address _ctxProgram, address) public {
        ComparisonOpcodes.opLt(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt(address _ctxProgram, address) public {
        ComparisonOpcodes.opGt(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe(address _ctxProgram, address) public {
        ComparisonOpcodes.opLe(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe(address _ctxProgram, address) public {
        ComparisonOpcodes.opGe(_ctxProgram, address(0));
    }

    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap(address _ctxProgram, address) public {
        ComparisonOpcodes.opSwap(_ctxProgram, address(0));
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(address _ctxProgram, address) public {
        ComparisonOpcodes.opNot(_ctxProgram, address(0));
    }
}
