// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ComplexOpcodes } from '../../libs/opcodes/ComplexOpcodes.sol';

contract ComplexOpcodesMock {
    receive() external payable {}

    function opLoadRemoteAny(address _ctxProgram, address _ctxDSL) public {
        ComplexOpcodes.opLoadRemoteAny(_ctxProgram, _ctxDSL);
    }

    function opLoadRemoteUint256(address _ctxProgram, address) public {
        ComplexOpcodes.opLoadRemoteUint256(_ctxProgram, address(0));
    }

    function opLoadRemoteBytes32(address _ctxProgram, address) public {
        ComplexOpcodes.opLoadRemoteBytes32(_ctxProgram, address(0));
    }

    function opLoadRemoteBool(address _ctxProgram, address) public {
        ComplexOpcodes.opLoadRemoteBool(_ctxProgram, address(0));
    }

    function opLoadRemoteAddress(address _ctxProgram, address) public {
        ComplexOpcodes.opLoadRemoteAddress(_ctxProgram, address(0));
    }

    function opDeclare(address _ctxProgram, address) public {
        ComplexOpcodes.opDeclare(_ctxProgram, address(0));
    }

    function opPush(address _ctxProgram, address) public {
        ComplexOpcodes.opPush(_ctxProgram, address(0));
    }

    function opGet(address _ctxProgram, address) public {
        ComplexOpcodes.opGet(_ctxProgram, address(0));
    }

    function opSumOf(address _ctxProgram, address _ctxDSL) public {
        ComplexOpcodes.opSumOf(_ctxProgram, _ctxDSL);
    }

    function opSumThroughStructs(address _ctxProgram, address _ctxDSL) public {
        ComplexOpcodes.opSumThroughStructs(_ctxProgram, _ctxDSL);
    }

    function opStruct(address _ctxProgram, address) public {
        ComplexOpcodes.opStruct(_ctxProgram, address(0));
    }

    function opLengthOf(address _ctxProgram, address) public {
        ComplexOpcodes.opLengthOf(_ctxProgram, address(0));
    }

    function opCompound(address _ctxProgram, address _ctxDSL) public {
        ComplexOpcodes.opCompound(_ctxProgram, _ctxDSL);
    }

    function opCompoundDeposit(address _ctxProgram, address) public {
        ComplexOpcodes.opCompoundDeposit(_ctxProgram, address(0));
    }

    function opCompoundDepositNative(address _ctxProgram, address) public {
        ComplexOpcodes.opCompoundDepositNative(_ctxProgram, address(0));
    }
}
