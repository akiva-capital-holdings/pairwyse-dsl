//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Context.sol";
import "hardhat/console.sol";

contract Opcodes {
    struct OpSpec {
        bytes1 Opcode;
        bytes4 selector;
        string name;
        uint8 pcSize;
    }
    
    Context ctx;
    
    mapping(bytes1 => OpSpec) public opsByOpcode;

    constructor(Context _ctx) {
        ctx = _ctx;

        opsByOpcode[hex"01"] = OpSpec(hex"01", this.opEq.selector, "==", 1);
        opsByOpcode[hex"02"] = OpSpec(hex"02", this.opNot.selector, "!=", 1);
        opsByOpcode[hex"03"] = OpSpec(hex"03", this.opLt.selector, "<", 1);
        opsByOpcode[hex"04"] = OpSpec(hex"04", this.opGt.selector, ">", 1);
        opsByOpcode[hex"05"] = OpSpec(hex"05", this.opSwap.selector, "swap", 1);
        opsByOpcode[hex"06"] = OpSpec(hex"06", this.opLe.selector, "<=", 1);
//        opsByOpcode[hex"07"] = OpSpec(hex"07", this.opGe.selector, ">=", 1);
        opsByOpcode[hex"08"] = OpSpec(hex"08", this.opBlock.selector, "block", 2);
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
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     */
    function opAnd() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        require(
            last.getType() == prev.getType()
            && last.getType() == StackValue.StackType.UINT256,
            "bad types"
        );

        bool result = (prev.getUint256() > 0) && (last.getUint256() > 0);

        StackValue resultValue = new StackValue();
        resultValue.setUint256(result ? 1 : 0);
        ctx.stack().push(resultValue);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        require(
            last.getType() == prev.getType()
            && last.getType() == StackValue.StackType.UINT256,
            "bad types"
        );

        bool result = (prev.getUint256() > 0) || (last.getUint256() > 0);

        StackValue resultValue = new StackValue();
        resultValue.setUint256(result ? 1 : 0);
        ctx.stack().push(resultValue);
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
        console.log("opBlock called");
        bytes memory fieldBytes = ctx.programAt(ctx.pc() + 1);
        console.logBytes(fieldBytes);
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