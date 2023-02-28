// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { CompoundOpcodes } from '../../libs/opcodes/CompoundOpcodes.sol';

contract CompoundOpcodesMock {
    receive() external payable {}

    function opCompound(address _ctxProgram, address _ctxDSL) public {
        CompoundOpcodes.opCompound(_ctxProgram, _ctxDSL);
    }

    function opCompoundDeposit(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundDeposit(_ctxProgram, address(0));
    }

    function opCompoundDepositNative(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundDepositNative(_ctxProgram, address(0));
    }

    function opCompoundBorrowMax(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundBorrowMax(_ctxProgram, address(0));
    }

    function opCompoundBorrow(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundBorrow(_ctxProgram, address(0));
    }
}
