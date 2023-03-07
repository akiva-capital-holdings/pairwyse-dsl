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

    function opCompoundWithdrawMax(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundWithdrawMax(_ctxProgram, address(0));
    }

    function opCompoundWithdraw(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundWithdraw(_ctxProgram, address(0));
    }

    function opCompoundBorrowMax(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundBorrowMax(_ctxProgram, address(0));
    }

    function opCompoundBorrow(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundBorrow(_ctxProgram, address(0));
    }

    function opCompoundRepayMax(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundRepayMax(_ctxProgram, address(0));
    }

    function opCompoundRepay(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundRepay(_ctxProgram, address(0));
    }

    function opCompoundRepayNativeMax(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundRepayNativeMax(_ctxProgram, address(0));
    }

    function opCompoundRepayNative(address _ctxProgram, address) public {
        CompoundOpcodes.opCompoundRepayNative(_ctxProgram, address(0));
    }
}
