//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Context.sol";
import "./Opcodes.sol";
import "hardhat/console.sol";

contract Eval {
    Context public ctx;
    Opcodes public opcodes;

    constructor() {
        ctx = new Context();
        opcodes = new Opcodes(ctx);
    }
    
    function eval() public {
        require(ctx.program().length > 0, "empty program");
        
        while (ctx.pc() < ctx.program().length) {
        // for (uint i = 0; i < 4; i++) {
            bytes memory opcodeBytes = ctx.programAt(ctx.pc(), 1);
//            console.logBytes(opcodeBytes);
            bytes1 opcodeByte1;

            // convert bytes to bytes1
            assembly {
                opcodeByte1 := mload(add(opcodeBytes, 0x20))
            }

//            console.logBytes1(opcodeByte1);

            (bytes1 opcode, bytes4 selector, string memory name, uint8 pcSize) = opcodes.opsByOpcode(opcodeByte1);
//            console.logBytes4(selector);
            console.log(name);
            
            address(opcodes).call(abi.encodeWithSelector(selector));
            
            ctx.incPc(uint(pcSize));
        }
    }
}