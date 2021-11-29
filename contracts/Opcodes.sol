//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IContext.sol";
import "./interfaces/IStorage.sol";
import "./libs/UnstructuredStorage.sol";
import { StackValue } from "./Stack.sol";
import "hardhat/console.sol";

contract Opcodes {
    using UnstructuredStorage for bytes32;

    struct OpSpec {
        bytes1 Opcode;
        bytes4 selector;
        string name;
        uint8 pcSize;
    }
    
    IContext ctx;

    mapping(bytes1 => OpSpec) public opsByOpcode;

    constructor(IContext _ctx) {
        ctx = _ctx;

        opsByOpcode[hex"01"] = OpSpec(hex"01", this.opEq.selector, "==", 1);
        opsByOpcode[hex"02"] = OpSpec(hex"02", this.opNot.selector, "!", 1);
        opsByOpcode[hex"03"] = OpSpec(hex"03", this.opLt.selector, "<", 1);
        opsByOpcode[hex"04"] = OpSpec(hex"04", this.opGt.selector, ">", 1);
        opsByOpcode[hex"05"] = OpSpec(hex"05", this.opSwap.selector, "swap", 1);
        opsByOpcode[hex"06"] = OpSpec(hex"06", this.opLe.selector, "<=", 1);
        opsByOpcode[hex"08"] = OpSpec(hex"08", this.opBlock.selector, "block", 1 + 1); // offset: 1 byte block + 1 byte value (timestamp, number, etc)

        // offset: 1 byte var + 4 bytes variable hex name
        opsByOpcode[hex"0a"] = OpSpec(hex"0a", this.opLoadLocalUint256.selector, "loadLocalUint256", 1 + 4);
        // offset: 1 byte var + 4 bytes variable hex name + 20 bytes address of an external contract
        opsByOpcode[hex"0b"] = OpSpec(hex"0b", this.opLoadRemoteUint256.selector, "loadRemoteUint256", 1 + 4 + 20);
        opsByOpcode[hex"0c"] = OpSpec(hex"0c", this.opLoadLocalBytes32.selector, "loadLocalBytes32", 1 + 4);
        opsByOpcode[hex"0d"] = OpSpec(hex"0d", this.opLoadRemoteBytes32.selector, "loadRemoteBytes32", 1 + 4 + 20);
        opsByOpcode[hex"0e"] = OpSpec(hex"0e", this.opLoadLocalBool.selector, "loadLocalBool", 1 + 4);
        opsByOpcode[hex"0f"] = OpSpec(hex"0f", this.opLoadRemoteBool.selector, "loadRemoteBool", 1 + 4 + 20);
        opsByOpcode[hex"10"] = OpSpec(hex"10", this.opLoadLocalAddress.selector, "loadLocalAddress", 1 + 4);
        opsByOpcode[hex"11"] = OpSpec(hex"11", this.opLoadRemoteAddress.selector, "loadRemoteAddress", 1 + 4 + 20);

        opsByOpcode[hex"12"] = OpSpec(hex"12", this.opAnd.selector, "and", 1);
        opsByOpcode[hex"13"] = OpSpec(hex"13", this.opOr.selector, "or", 1);
        opsByOpcode[hex"14"] = OpSpec(hex"14", this.opNotEq.selector, "!=", 1);
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
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        
        require(last.getType() == prev.getType(), "type mismatch");
        
        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = last.getUint256() != prev.getUint256();
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
        // console.log("opBlock called");
        bytes memory fieldBytes = ctx.programAt(ctx.pc() + 1, 1);
        // console.logBytes(fieldBytes);
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

        IContext.BlockField field = IContext.BlockField(uint(fieldb32));
        // console.log("block field %s", uint(field));
        
        uint result;
        
        if (field == IContext.BlockField.NUMBER) {
            result = block.number;
        } else if (field == IContext.BlockField.TIMESTAMP) {
            result = block.timestamp;
        } else if (field == IContext.BlockField.CHAIN_ID) {
            result = block.chainid;
        }

        StackValue resultValue = new StackValue();
        resultValue.setUint256(result);
        ctx.stack().push(resultValue);
    }

    function opLoadLocalUint256(address app) public {
        opLoadLocal(app, "getStorageUint256(bytes32)");
    }

    function opLoadLocalBytes32(address app) public {
        opLoadLocal(app, "getStorageBytes32(bytes32)");
    }

    function opLoadLocalBool(address app) public {
        opLoadLocal(app, "getStorageBool(bytes32)");
    }

    function opLoadLocalAddress(address app) public {
        opLoadLocal(app, "getStorageAddress(bytes32)");
    }

    function opLoadRemoteUint256() public {
        opLoadRemote("getStorageUint256(bytes32)");
    }

    function opLoadRemoteBytes32() public {
        opLoadRemote("getStorageBytes32(bytes32)");
    }

    function opLoadRemoteBool() public {
        opLoadRemote("getStorageBool(bytes32)");
    }

    function opLoadRemoteAddress() public {
        opLoadRemote("getStorageAddress(bytes32)");
    }

    function opLoadLocal(address app, string memory funcSignature) internal {
        bytes memory varName = ctx.programAt(ctx.pc() + 1, 4);

        // Convert bytes to bytes32
        bytes32 varNameB32;
        assembly { varNameB32 := mload(add(varName, 0x20)) }

        // Load local value by it's hex
        (bool success, bytes memory data) = app.call(
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        require(success, "Can't call a function");

        // Convert bytes to bytes32
        bytes32 result;
        assembly { result := mload(add(data, 0x20)) }

        // console.logBytes32(result);

        StackValue resultValue = new StackValue();
        resultValue.setUint256(uint(result));
        ctx.stack().push(resultValue);
    }

    function opLoadRemote(string memory funcSignature) internal {
        bytes memory varName = ctx.programAt(ctx.pc() + 1, 4);
        bytes memory contractAddrBytes = ctx.programAt(ctx.pc() + 1 + 4, 20);

        // Convert bytes to bytes32
        bytes32 varNameB32;
        bytes32 contractAddrB32;
        assembly {
            varNameB32 := mload(add(varName, 0x20))
            contractAddrB32 := mload(add(contractAddrBytes, 0x20))
        }
        /**
         * Shift bytes to the left so that 
         * 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512000000000000000000000000
         * transforms into
         * 0x000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512
         * This is needed to later conversion from bytes32 to address
         */
        contractAddrB32 >>= 96;

        // console.log("contractAddrB32");
        // console.logBytes32(contractAddrB32);

        address contractAddr = address(uint160(uint256(contractAddrB32)));
        // console.log("contractAddr =", contractAddr);

        // Load local value by it's hex
        (bool success, bytes memory data) = contractAddr.call(
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        require(success, "Can't call a function");

        // Convert bytes to bytes32
        bytes32 result;
        assembly { result := mload(add(data, 0x20)) }

        // console.log("variable =", uint(result));

        StackValue resultValue = new StackValue();
        resultValue.setUint256(uint(result));
        ctx.stack().push(resultValue);
    }
}