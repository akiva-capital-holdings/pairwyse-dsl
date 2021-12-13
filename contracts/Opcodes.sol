//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IContext.sol";
import "./interfaces/IStorage.sol";
import "./libs/UnstructuredStorage.sol";
import {StackValue} from "./Stack.sol";
import "hardhat/console.sol";

contract Opcodes {
    using UnstructuredStorage for bytes32;

    IContext public ctx;

    constructor(IContext _ctx) {
        ctx = _ctx;
    }

    function opLoadLocalAny() public {
        bytes4 selector = nextBranchSelector("loadLocal");
        mustCall(address(this), abi.encodeWithSelector(selector));
    }

    function opLoadRemoteAny() public {
        bytes4 selector = nextBranchSelector("loadRemote");
        mustCall(address(this), abi.encodeWithSelector(selector));
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

        putUint256ToStack(result ? 1 : 0);
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

        putUint256ToStack(result ? 1 : 0);
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

        putUint256ToStack(result ? 1 : 0);
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
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe() public {
        opLt();
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
        require(last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256, "bad types");
        bool result = (prev.getUint256() > 0) && (last.getUint256() > 0);
        putUint256ToStack(result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr() public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        require(last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256, "bad types");
        bool result = (prev.getUint256() > 0) || (last.getUint256() > 0);
        putUint256ToStack(result ? 1 : 0);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot() public {
        StackValue last = ctx.stack().pop();
        require(last.getType() == StackValue.StackType.UINT256, "opNot require uint256");
        bool result = last.getUint256() == 0;
        putUint256ToStack(result ? 1 : 0);
    }

    function opBlockNumber() public {
        putUint256ToStack(block.number);
    }

    function opBlockTimestamp() public {
        putUint256ToStack(block.timestamp);
    }

    function opBlockChainId() public {
        putUint256ToStack(block.chainid);
    }

    function opLoadLocalUint256() public {
        opLoadLocal("getStorageUint256(bytes32)");
    }

    function opLoadLocalBytes32() public {
        opLoadLocal("getStorageBytes32(bytes32)");
    }

    function opLoadLocalBool() public {
        opLoadLocal("getStorageBool(bytes32)");
    }

    function opLoadLocalAddress() public {
        opLoadLocal("getStorageAddress(bytes32)");
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

    function opBool() public {
        bytes memory data = nextBytes(1);
        putUint256ToStack(uint256(uint8(data[0])));
    }

    function opUint256() public {
        bytes memory data = nextBytes(32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        putUint256ToStack(uint256(result));
    }

    function putUint256ToStack(uint256 result) private {
        StackValue resultValue = new StackValue();
        resultValue.setUint256(result);
        ctx.stack().push(resultValue);
    }

    function nextBytes(uint256 size) private returns (bytes memory out) {
        out = ctx.programAt(ctx.pc(), size);
        ctx.incPc(size);
    }

    function nextBytes1() private returns (bytes1) {
        return nextBytes(1)[0];
    }

    function nextBranchSelector(string memory baseOpName) private returns (bytes4) {
        bytes1 branchCode = nextBytes1();
        return ctx.branchSelectors(baseOpName, branchCode);
    }

    function mustCall(address addr, bytes memory data) private {
        (bool success,) = address(addr).call(data);
        require(success, "call not success");
    }

    function opLoadLocal(string memory funcSignature) private {
        bytes memory varName = nextBytes(4);

        // Convert bytes to bytes32
        bytes32 varNameB32;
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }

        // Load local value by it's hex
        (bool success, bytes memory data) = ctx.appAddress().call(
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        require(success, "Can't call a function");

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        // console.logBytes32(result);

        putUint256ToStack(uint256(result));
    }

    function opLoadRemote(string memory funcSignature) private {
        bytes memory varName = nextBytes(4);
        bytes memory contractAddrBytes = nextBytes(20);

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
        (bool success, bytes memory data) = contractAddr.call(abi.encodeWithSignature(funcSignature, varNameB32));
        require(success, "Can't call a function");

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        // console.log("variable =", uint256(result));

        putUint256ToStack(uint256(result));
    }
}
