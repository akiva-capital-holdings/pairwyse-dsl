//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Context.sol";
import "hardhat/console.sol";

contract Opcodes {
    Context ctx;

    constructor(Context _ctx) {
        ctx = _ctx;
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        
        require(last.getType() == prev.getType(), "type mismatch");
        
        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = last.getUint256() == prev.getUint256();
        }
        
        StackValue resultValue = new StackValue();
        resultValue.setUint256(result ? 1 : 0);
        ctx.stack().push(resultValue);
    }
    
    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        require(last.getType() == prev.getType(), "type mismatch");
        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = prev.getUint256() < last.getUint256();
        }

        StackValue resultValue = new StackValue();
        resultValue.setUint256(result ? 1 : 0);
        ctx.stack().push(resultValue);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt() public {
        opSwap();
        opLt();
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe() public {
        opGt();
        opNot();
    }
    
    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        ctx.stack().push(last);
        ctx.stack().push(prev);
    }
    
    /**
     * @dev Revert last value in the stack
     */
    function opNot() public {
        StackValue last = ctx.stack().pop();

        require(last.getType() == StackValue.StackType.UINT256, "opNot require uint256");

        bool result = last.getUint256() == 0;

        StackValue resultValue = new StackValue();
        resultValue.setUint256(result ? 1 : 0);
        ctx.stack().push(resultValue);
    }
    
    function opBlock() public {
        bytes memory fieldBytes = ctx.programAt(ctx.pc() + 1);
        bytes32 fieldb32;

        // convert bytes to bytes32
        assembly {
            // We shift by 248 bits (256 - 8 [field byte]) it right since mload will always load 32 bytes (a word).
            // This will also zero out unused data.
            // we need to it because mload creates
            // 0x0500000000000000000000000000000000000000000000000000000000000000
            // and after bit shifting it becomes
            // 0x0000000000000000000000000000000000000000000000000000000000000005 which is 5
            fieldb32 := shr(0xf8, mload(add(fieldBytes, 0x20)))
        }

        Context.BlockField field = Context.BlockField(uint(fieldb32));
        console.log("block field %s", uint(field));
        
        uint result;
        
        if (field == Context.BlockField.NUMBER) {
            result = block.number;
        } else if (field == Context.BlockField.TIMESTAMP) {
            result = block.timestamp;
        } else if (field == Context.BlockField.CHAIN_ID) {
            result = block.chainid;
        }

        StackValue resultValue = new StackValue();
        resultValue.setUint256(result);
        ctx.stack().push(resultValue);
    }
}