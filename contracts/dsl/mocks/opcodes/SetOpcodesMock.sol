// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { LogicalOpcodes } from '../../libs/opcodes/LogicalOpcodes.sol';

contract LogicalOpcodesMock {
    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     */
    function opAnd(IContext _ctx) public {
        LogicalOpcodes.opAnd(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr(IContext _ctx) public {
        LogicalOpcodes.opOr(_ctx);
    }

    function opXor(IContext _ctx) public {
        LogicalOpcodes.opXor(_ctx);
    }

    function opAdd(IContext _ctx) public {
        LogicalOpcodes.opAdd(_ctx);
    }
}
