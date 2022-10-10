// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { OtherOpcodes } from '../../libs/opcodes/OtherOpcodes.sol';

contract OtherOpcodesMock {
    receive() external payable {}

    function opLoadRemoteAny(address _ctx) public {
        OtherOpcodes.opLoadRemoteAny(_ctx);
    }

    function opBlockNumber(address _ctx) public {
        OtherOpcodes.opBlockNumber(_ctx);
    }

    function opBlockTimestamp(address _ctx) public {
        OtherOpcodes.opBlockTimestamp(_ctx);
    }

    function opBlockChainId(address _ctx) public {
        OtherOpcodes.opBlockChainId(_ctx);
    }

    function opMsgSender(address _ctx) public {
        OtherOpcodes.opMsgSender(_ctx);
    }

    function opMsgValue(address _ctx) public {
        OtherOpcodes.opMsgValue(_ctx);
    }

    function opSetLocalBool(address _ctx) public {
        OtherOpcodes.opSetLocalBool(_ctx);
    }

    function opSetUint256(address _ctx) public {
        OtherOpcodes.opSetUint256(_ctx);
    }

    function opTransferVar(address _ctx) public {
        OtherOpcodes.opTransferVar(_ctx);
    }

    function opBalanceOf(address _ctx) public {
        OtherOpcodes.opBalanceOf(_ctx);
    }

    function opTransferFromVar(address _ctx) public {
        OtherOpcodes.opTransferFromVar(_ctx);
    }

    function opLoadLocalUint256(address _ctx) public {
        OtherOpcodes.opLoadLocalUint256(_ctx);
    }

    function opLoadRemoteUint256(address _ctx) public {
        OtherOpcodes.opLoadRemoteUint256(_ctx);
    }

    function opLoadRemoteBytes32(address _ctx) public {
        OtherOpcodes.opLoadRemoteBytes32(_ctx);
    }

    function opLoadRemoteBool(address _ctx) public {
        OtherOpcodes.opLoadRemoteBool(_ctx);
    }

    function opLoadRemoteAddress(address _ctx) public {
        OtherOpcodes.opLoadRemoteAddress(_ctx);
    }

    function opBool(address _ctx) public {
        OtherOpcodes.opBool(_ctx);
    }

    function opUint256(address _ctx) public {
        OtherOpcodes.opUint256(_ctx);
    }

    function opSendEth(address _ctx) public {
        OtherOpcodes.opSendEth(_ctx);
    }

    function opTransfer(address _ctx) public {
        OtherOpcodes.opTransfer(_ctx);
    }

    function opTransferFrom(address _ctx) public {
        OtherOpcodes.opTransferFrom(_ctx);
    }

    function opUint256Get(address _ctx) public returns (uint256) {
        return OtherOpcodes.opUint256Get(_ctx);
    }

    function opLoadLocalGet(address _ctx, string memory funcSignature)
        public
        returns (bytes32 result)
    {
        return OtherOpcodes.opLoadLocalGet(_ctx, funcSignature);
    }

    function opAddressGet(address _ctx) public returns (address) {
        return OtherOpcodes.opAddressGet(_ctx);
    }

    function opLoadLocal(address _ctx, string memory funcSignature) public {
        OtherOpcodes.opLoadLocal(_ctx, funcSignature);
    }

    function opLoadRemote(address _ctx, string memory funcSignature) public {
        OtherOpcodes.opLoadRemote(_ctx, funcSignature);
    }

    function opDeclare(address _ctx) public {
        OtherOpcodes.opDeclare(_ctx);
    }

    function opPush(address _ctx) public {
        OtherOpcodes.opPush(_ctx);
    }

    function opGet(address _ctx) public {
        OtherOpcodes.opGet(_ctx);
    }

    function opSumOf(address _ctx) public {
        OtherOpcodes.opSumOf(_ctx);
    }

    function opStruct(address _ctx) public {
        OtherOpcodes.opStruct(_ctx);
    }

    function opLengthOf(address _ctx) public {
        OtherOpcodes.opLengthOf(_ctx);
    }
}
