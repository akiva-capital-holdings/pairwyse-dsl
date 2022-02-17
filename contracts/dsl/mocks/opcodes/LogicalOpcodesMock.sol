// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { LogicalOpcodes } from '../../libs/opcodes/LogicalOpcodes.sol';

contract LogicalOpcodesMock {
    function opIfelse(IContext _ctx) public {
        LogicalOpcodes.opIfelse(_ctx);
    }

    function opEnd(IContext _ctx) public {
        LogicalOpcodes.opEnd(_ctx);
    }
}
