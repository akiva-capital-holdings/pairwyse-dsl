// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ComparisonOpcodes } from '../../libs/opcodes/ComparisonOpcodes.sol';

contract ComparisonOpcodesMock {
    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(address _ctx) public {
        ComparisonOpcodes.opEq(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(address _ctx) public {
        ComparisonOpcodes.opNotEq(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(address _ctx) public {
        ComparisonOpcodes.opLt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt(address _ctx) public {
        ComparisonOpcodes.opGt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe(address _ctx) public {
        ComparisonOpcodes.opLe(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe(address _ctx) public {
        ComparisonOpcodes.opGe(_ctx);
    }

    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap(address _ctx) public {
        ComparisonOpcodes.opSwap(_ctx);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(address _ctx) public {
        ComparisonOpcodes.opNot(_ctx);
    }
}
