// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { OtherOpcodes } from '../../libs/opcodes/OtherOpcodes.sol';

contract OtherOpcodesMock {
    receive() external payable {}

    function opLoadRemoteAny(address _ctxProgram, address _ctxDSL) public {
        OtherOpcodes.opLoadRemoteAny(_ctxProgram, _ctxDSL);
    }

    function opBlockNumber(address _ctxProgram, address) public {
        OtherOpcodes.opBlockNumber(_ctxProgram, address(0));
    }

    function opBlockTimestamp(address _ctxProgram, address) public {
        OtherOpcodes.opBlockTimestamp(_ctxProgram, address(0));
    }

    function opBlockChainId(address _ctxProgram, address) public {
        OtherOpcodes.opBlockChainId(_ctxProgram, address(0));
    }

    function opMsgSender(address _ctxProgram, address) public {
        OtherOpcodes.opMsgSender(_ctxProgram, address(0));
    }

    function opMsgValue(address _ctxProgram, address) public {
        OtherOpcodes.opMsgValue(_ctxProgram, address(0));
    }

    function opSetLocalBool(address _ctxProgram, address) public {
        OtherOpcodes.opSetLocalBool(_ctxProgram, address(0));
    }

    function opSetUint256(address _ctxProgram, address) public {
        OtherOpcodes.opSetUint256(_ctxProgram, address(0));
    }

    function opTransferVar(address _ctxProgram, address) public {
        OtherOpcodes.opTransferVar(_ctxProgram, address(0));
    }

    function opBalanceOf(address _ctxProgram, address) public {
        OtherOpcodes.opBalanceOf(_ctxProgram, address(0));
    }

    function opTransferFromVar(address _ctxProgram, address) public {
        OtherOpcodes.opTransferFromVar(_ctxProgram, address(0));
    }

    function opLoadLocalUint256(address _ctxProgram, address) public {
        OtherOpcodes.opLoadLocalUint256(_ctxProgram, address(0));
    }

    function opLoadRemoteUint256(address _ctxProgram, address) public {
        OtherOpcodes.opLoadRemoteUint256(_ctxProgram, address(0));
    }

    function opLoadRemoteBytes32(address _ctxProgram, address) public {
        OtherOpcodes.opLoadRemoteBytes32(_ctxProgram, address(0));
    }

    function opLoadRemoteBool(address _ctxProgram, address) public {
        OtherOpcodes.opLoadRemoteBool(_ctxProgram, address(0));
    }

    function opLoadRemoteAddress(address _ctxProgram, address) public {
        OtherOpcodes.opLoadRemoteAddress(_ctxProgram, address(0));
    }

    function opBool(address _ctxProgram, address) public {
        OtherOpcodes.opBool(_ctxProgram, address(0));
    }

    function opUint256(address _ctxProgram, address) public {
        OtherOpcodes.opUint256(_ctxProgram, address(0));
    }

    function opSendEth(address _ctxProgram, address) public {
        OtherOpcodes.opSendEth(_ctxProgram, address(0));
    }

    function opTransfer(address _ctxProgram, address) public {
        OtherOpcodes.opTransfer(_ctxProgram, address(0));
    }

    function opTransferFrom(address _ctxProgram, address) public {
        OtherOpcodes.opTransferFrom(_ctxProgram, address(0));
    }

    function opUint256Get(address _ctxProgram, address) public returns (uint256) {
        return OtherOpcodes.opUint256Get(_ctxProgram, address(0));
    }

    function opLoadLocalGet(
        address _ctxProgram,
        string memory funcSignature
    ) public returns (bytes32 result) {
        return OtherOpcodes.opLoadLocalGet(_ctxProgram, funcSignature);
    }

    function opAddressGet(address _ctxProgram, address) public returns (address) {
        return OtherOpcodes.opAddressGet(_ctxProgram, address(0));
    }

    function opLoadLocal(address _ctxProgram, string memory funcSignature) public {
        OtherOpcodes.opLoadLocal(_ctxProgram, funcSignature);
    }

    function opLoadRemote(address _ctxProgram, string memory funcSignature) public {
        OtherOpcodes.opLoadRemote(_ctxProgram, funcSignature);
    }

    function opDeclare(address _ctxProgram, address) public {
        OtherOpcodes.opDeclare(_ctxProgram, address(0));
    }

    function opPush(address _ctxProgram, address) public {
        OtherOpcodes.opPush(_ctxProgram, address(0));
    }

    function opGet(address _ctxProgram, address) public {
        OtherOpcodes.opGet(_ctxProgram, address(0));
    }

    function opSumOf(address _ctxProgram, address _ctxDSL) public {
        OtherOpcodes.opSumOf(_ctxProgram, _ctxDSL);
    }

    function opSumThroughStructs(address _ctxProgram, address _ctxDSL) public {
        OtherOpcodes.opSumThroughStructs(_ctxProgram, _ctxDSL);
    }

    function opStruct(address _ctxProgram, address) public {
        OtherOpcodes.opStruct(_ctxProgram, address(0));
    }

    function opLengthOf(address _ctxProgram, address) public {
        OtherOpcodes.opLengthOf(_ctxProgram, address(0));
    }

    function opEnableRecord(address _ctxProgram, address) public {
        OtherOpcodes.opEnableRecord(_ctxProgram, address(0));
    }
}
