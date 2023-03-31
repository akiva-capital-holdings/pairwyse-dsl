/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { BranchingOpcodes } from '../../libs/opcodes/BranchingOpcodes.sol';

contract BranchingOpcodesMock {
    function opIfelse(address _ctxProgram, address) public {
        BranchingOpcodes.opIfelse(_ctxProgram, address(0));
    }

    function opIf(address _ctxProgram, address) public {
        BranchingOpcodes.opIf(_ctxProgram, address(0));
    }

    function opEnd(address _ctxProgram, address) public {
        BranchingOpcodes.opEnd(_ctxProgram, address(0));
    }

    function getUint16(address _ctxProgram) public returns (uint16) {
        return BranchingOpcodes.getUint16(_ctxProgram);
    }

    function opFunc(address _ctxProgram, address) public {
        BranchingOpcodes.opFunc(_ctxProgram, address(0));
    }
}
