/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { LogicalOpcodes } from '../../libs/opcodes/LogicalOpcodes.sol';

contract LogicalOpcodesMock {
    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     */
    function opAnd(address _ctxProgram, address) public {
        LogicalOpcodes.opAnd(_ctxProgram, address(0));
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr(address _ctxProgram, address) public {
        LogicalOpcodes.opOr(_ctxProgram, address(0));
    }

    function opXor(address _ctxProgram, address) public {
        LogicalOpcodes.opXor(_ctxProgram, address(0));
    }

    function opAdd(address _ctxProgram, address) public {
        LogicalOpcodes.opAdd(_ctxProgram, address(0));
    }

    function opSub(address _ctxProgram, address) public {
        LogicalOpcodes.opSub(_ctxProgram, address(0));
    }

    function opMul(address _ctxProgram, address) public {
        LogicalOpcodes.opMul(_ctxProgram, address(0));
    }

    function opDiv(address _ctxProgram, address) public {
        LogicalOpcodes.opDiv(_ctxProgram, address(0));
    }
}
