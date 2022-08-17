// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { OtherOpcodes } from '../../libs/opcodes/OtherOpcodes.sol';
import { Storage } from '../../helpers/Storage.sol';

contract OtherOpcodesMock is Storage {
    receive() external payable {}

    function opLoadLocalAny(IContext _ctx) public {
        OtherOpcodes.opLoadLocalAny(_ctx);
    }

    function opLoadRemoteAny(IContext _ctx) public {
        OtherOpcodes.opLoadRemoteAny(_ctx);
    }

    function opBlockNumber(IContext _ctx) public {
        OtherOpcodes.opBlockNumber(_ctx);
    }

    function opBlockTimestamp(IContext _ctx) public {
        OtherOpcodes.opBlockTimestamp(_ctx);
    }

    function opBlockChainId(IContext _ctx) public {
        OtherOpcodes.opBlockChainId(_ctx);
    }

    function opMsgSender(IContext _ctx) public {
        OtherOpcodes.opMsgSender(_ctx);
    }

    function opMsgValue(IContext _ctx) public {
        OtherOpcodes.opMsgValue(_ctx);
    }

    function opSetLocalBool(IContext _ctx) public {
        OtherOpcodes.opSetLocalBool(_ctx);
    }

    function opSetUint256(IContext _ctx) public {
        OtherOpcodes.opSetUint256(_ctx);
    }

    function opTransferVar(IContext _ctx) public {
        OtherOpcodes.opTransferVar(_ctx);
    }

    function opBalanceOf(IContext _ctx) public {
        OtherOpcodes.opBalanceOf(_ctx);
    }

    function opTransferFromVar(IContext _ctx) public {
        OtherOpcodes.opTransferFromVar(_ctx);
    }

    function opLoadLocalUint256(IContext _ctx) public {
        OtherOpcodes.opLoadLocalUint256(_ctx);
    }

    function opLoadLocalBytes32(IContext _ctx) public {
        OtherOpcodes.opLoadLocalBytes32(_ctx);
    }

    function opLoadLocalBool(IContext _ctx) public {
        OtherOpcodes.opLoadLocalBool(_ctx);
    }

    function opLoadLocalAddress(IContext _ctx) public {
        OtherOpcodes.opLoadLocalAddress(_ctx);
    }

    function opLoadRemoteUint256(IContext _ctx) public {
        OtherOpcodes.opLoadRemoteUint256(_ctx);
    }

    function opLoadRemoteBytes32(IContext _ctx) public {
        OtherOpcodes.opLoadRemoteBytes32(_ctx);
    }

    function opLoadRemoteBool(IContext _ctx) public {
        OtherOpcodes.opLoadRemoteBool(_ctx);
    }

    function opLoadRemoteAddress(IContext _ctx) public {
        OtherOpcodes.opLoadRemoteAddress(_ctx);
    }

    function opBool(IContext _ctx) public {
        OtherOpcodes.opBool(_ctx);
    }

    function opUint256(IContext _ctx) public {
        OtherOpcodes.opUint256(_ctx);
    }

    function opSendEth(IContext _ctx) public {
        OtherOpcodes.opSendEth(_ctx);
    }

    function opTransfer(IContext _ctx) public {
        OtherOpcodes.opTransfer(_ctx);
    }

    function opTransferFrom(IContext _ctx) public {
        OtherOpcodes.opTransferFrom(_ctx);
    }

    function opUint256Get(IContext _ctx) public returns (uint256) {
        return OtherOpcodes.opUint256Get(_ctx);
    }

    function opLoadLocalGet(IContext _ctx, string memory funcSignature)
        public
        returns (bytes32 result)
    {
        return OtherOpcodes.opLoadLocalGet(_ctx, funcSignature);
    }

    function opAddressGet(IContext _ctx) public returns (address) {
        return OtherOpcodes.opAddressGet(_ctx);
    }

    function opLoadLocal(IContext _ctx, string memory funcSignature) public {
        OtherOpcodes.opLoadLocal(_ctx, funcSignature);
    }

    function opLoadRemote(IContext _ctx, string memory funcSignature) public {
        OtherOpcodes.opLoadRemote(_ctx, funcSignature);
    }
}
