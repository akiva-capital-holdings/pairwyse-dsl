// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { LogicalOpcodes } from '../../libs/opcodes/LogicalOpcodes.sol';

contract LogicalOpcodesMock {
    function opBnz(IContext _ctx) public {
        LogicalOpcodes.opBnz(_ctx);
    }

    function opEnd(IContext _ctx) public {
        LogicalOpcodes.opEnd(_ctx);
    }
}
