/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
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

    function opLoadRemote(address _ctxProgram, string memory _funcSignature) public {
        ComplexOpcodes._opLoadRemote(_ctxProgram, _funcSignature);
    }
}
