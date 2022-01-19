//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Context.sol";
import "./Opcodes.sol";
import "hardhat/console.sol";

contract Eval {
    Context public ctx;
    Opcodes public opcodes;

    constructor(Context _ctx, Opcodes _opcodes) {
        ctx = _ctx;
        opcodes = _opcodes;
    }

    function eval() public {
        evalWithContext(address(this), msg.sender);
    }

    function evalWithContext(address storageFrom, address msgSender) public {
        require(ctx.program().length > 0, "empty program");

        ctx.setAppAddress(storageFrom);
        ctx.setMsgSender(msgSender);

        while (ctx.pc() < ctx.program().length) {
            bytes memory opcodeBytes = ctx.programAt(ctx.pc(), 1);
            bytes1 opcodeByte1;

            // convert bytes to bytes1
            assembly {
                opcodeByte1 := mload(add(opcodeBytes, 0x20))
            }

            // console.log("opcodeBytes1");
            // console.logBytes1(opcodeByte1);

            bytes4 selector = ctx.selectorByOpcode(opcodeByte1);
            require(selector != 0x0, "Eval: did not find selector for opcode");

            ctx.incPc(1);

            (bool success, ) = address(opcodes).call(abi.encodeWithSelector(selector, address(ctx)));
            require(success, "Eval: call not success");
        }
    }
}
