// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { BranchingOpcodes } from '../../libs/opcodes/BranchingOpcodes.sol';

contract BranchingOpcodesMock {
    function opIfelse(IContext _ctx) public {
        BranchingOpcodes.opIfelse(_ctx);
    }

    function opIf(IContext _ctx) public {
        BranchingOpcodes.opIf(_ctx);
    }

    function opEnd(IContext _ctx) public {
        BranchingOpcodes.opEnd(_ctx);
    }

    function getUint16(IContext _ctx) public returns (uint16) {
        return BranchingOpcodes.getUint16(_ctx);
    }
}
