// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { LogicalOpcodes } from '../../libs/opcodes/LogicalOpcodes.sol';

contract LogicalOpcodesMock {
    function opAnd(address _ctx) public {
        LogicalOpcodes.opAnd(_ctx);
    }

    function opOr(address _ctx) public {
        LogicalOpcodes.opOr(_ctx);
    }

    function opXor(address _ctx) public {
        LogicalOpcodes.opXor(_ctx);
    }

    function opAdd(address _ctx) public {
        LogicalOpcodes.opAdd(_ctx);
    }

    function opSub(address _ctx) public {
        LogicalOpcodes.opSub(_ctx);
    }

    function opMul(address _ctx) public {
        LogicalOpcodes.opMul(_ctx);
    }

    function opDiv(address _ctx) public {
        LogicalOpcodes.opDiv(_ctx);
    }
}
