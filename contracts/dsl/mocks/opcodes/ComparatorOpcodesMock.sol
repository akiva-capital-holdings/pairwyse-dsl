// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { ComparatorOpcodes } from '../../libs/opcodes/ComparatorOpcodes.sol';

contract ComparatorOpcodesMock {
    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(IContext _ctx) public {
        ComparatorOpcodes.opEq(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(IContext _ctx) public {
        ComparatorOpcodes.opNotEq(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(IContext _ctx) public {
        ComparatorOpcodes.opLt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt(IContext _ctx) public {
        ComparatorOpcodes.opGt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe(IContext _ctx) public {
        ComparatorOpcodes.opLe(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe(IContext _ctx) public {
        ComparatorOpcodes.opGe(_ctx);
    }

    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap(IContext _ctx) public {
        ComparatorOpcodes.opSwap(_ctx);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(IContext _ctx) public {
        ComparatorOpcodes.opNot(_ctx);
    }
}
