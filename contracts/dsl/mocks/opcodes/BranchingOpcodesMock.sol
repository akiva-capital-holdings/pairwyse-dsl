// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { BranchingOpcodes } from '../../libs/opcodes/BranchingOpcodes.sol';

contract BranchingOpcodesMock {
    function opIfelse(address _ctx) public {
        BranchingOpcodes.opIfelse(_ctx);
    }

    function opIf(address _ctx) public {
        BranchingOpcodes.opIf(_ctx);
    }

    function opEnd(address _ctx) public {
        BranchingOpcodes.opEnd(_ctx);
    }

    function getUint16(address _ctx) public returns (uint16) {
        return BranchingOpcodes.getUint16(_ctx);
    }
}
