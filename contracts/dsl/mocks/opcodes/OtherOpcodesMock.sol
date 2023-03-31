/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { OtherOpcodes } from '../../libs/opcodes/OtherOpcodes.sol';

contract OtherOpcodesMock {
    receive() external payable {}

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

    function opTransferFromVar(address _ctxProgram, address) public {
        OtherOpcodes.opTransferFromVar(_ctxProgram, address(0));
    }

    function opBalanceOf(address _ctxProgram, address) public {
        OtherOpcodes.opBalanceOf(_ctxProgram, address(0));
    }

    function opAllowance(address _ctxProgram, address) public {
        OtherOpcodes.opAllowance(_ctxProgram, address(0));
    }

    function opMint(address _ctxProgram, address) public {
        OtherOpcodes.opMint(_ctxProgram, address(0));
    }

    function opBurn(address _ctxProgram, address) public {
        OtherOpcodes.opBurn(_ctxProgram, address(0));
    }

    function opLoadLocalUint256(address _ctxProgram, address) public {
        OtherOpcodes.opLoadLocalUint256(_ctxProgram, address(0));
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

    function opAddressGet(address _ctxProgram, address) public returns (address) {
        return OtherOpcodes.opAddressGet(_ctxProgram, address(0));
    }

    function opLoadLocal(address _ctxProgram, string memory funcSignature) public {
        OtherOpcodes.opLoadLocal(_ctxProgram, funcSignature);
    }

    function opEnableRecord(address _ctxProgram, address) public {
        OtherOpcodes.opEnableRecord(_ctxProgram, address(0));
    }
}
