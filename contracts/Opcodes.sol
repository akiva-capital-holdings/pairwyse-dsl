// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./interfaces/IContext.sol";
import "./interfaces/IStorage.sol";
import "./interfaces/IERC20.sol";
import "./libs/UnstructuredStorage.sol";
import { StackValue } from "./helpers/Stack.sol";
import "hardhat/console.sol";

contract Opcodes {
    using UnstructuredStorage for bytes32;

    // IContext public ctx;

    // constructor(IContext _ctx) {
    //     ctx = _ctx;
    // }

    /* solhint-disable-next-line no-empty-blocks */
    receive() external payable {}

    function opLoadLocalAny(IContext ctx) public {
        bytes4 selector = nextBranchSelector(ctx, "loadLocal");
        mustCall(address(this), abi.encodeWithSelector(selector, ctx));
    }

    function opLoadRemoteAny(IContext ctx) public {
        bytes4 selector = nextBranchSelector(ctx, "loadRemote");
        mustCall(address(this), abi.encodeWithSelector(selector, ctx));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        require(last.getType() == prev.getType(), "type mismatch");

        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = last.getUint256() == prev.getUint256();
        }

        putUint256ToStack(ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        require(last.getType() == prev.getType(), "type mismatch");

        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = last.getUint256() != prev.getUint256();
        }

        putUint256ToStack(ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();

        require(last.getType() == prev.getType(), "type mismatch");
        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = prev.getUint256() < last.getUint256();
        }

        putUint256ToStack(ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt(IContext ctx) public {
        opSwap(ctx);
        opLt(ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe(IContext ctx) public {
        opGt(ctx);
        opNot(ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe(IContext ctx) public {
        opLt(ctx);
        opNot(ctx);
    }

    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        ctx.stack().push(last);
        ctx.stack().push(prev);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     */
    function opAnd(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        require(last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256, "bad types");
        bool result = (prev.getUint256() > 0) && (last.getUint256() > 0);
        putUint256ToStack(ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        require(last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256, "bad types");
        bool result = (prev.getUint256() > 0) || (last.getUint256() > 0);
        putUint256ToStack(ctx, result ? 1 : 0);
    }

    function opXor(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        StackValue prev = ctx.stack().pop();
        require(last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256, "bad types");
        bool result = ((prev.getUint256() > 0) && (last.getUint256() == 0)) ||
            ((prev.getUint256() == 0) && (last.getUint256() > 0));
        putUint256ToStack(ctx, result ? 1 : 0);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(IContext ctx) public {
        StackValue last = ctx.stack().pop();
        require(last.getType() == StackValue.StackType.UINT256, "opNot require uint256");
        bool result = last.getUint256() == 0;
        putUint256ToStack(ctx, result ? 1 : 0);
    }

    function opBlockNumber(IContext ctx) public {
        putUint256ToStack(ctx, block.number);
    }

    function opBlockTimestamp(IContext ctx) public {
        putUint256ToStack(ctx, block.timestamp);
    }

    function opBlockChainId(IContext ctx) public {
        putUint256ToStack(ctx, block.chainid);
    }

    function opMsgSender(IContext ctx) public {
        putUint256ToStack(ctx, uint256(uint160(ctx.msgSender())));
    }

    function opLoadLocalUint256(IContext ctx) public {
        opLoadLocal(ctx, "getStorageUint256(bytes32)");
    }

    function opLoadLocalBytes32(IContext ctx) public {
        opLoadLocal(ctx, "getStorageBytes32(bytes32)");
    }

    function opLoadLocalBool(IContext ctx) public {
        opLoadLocal(ctx, "getStorageBool(bytes32)");
    }

    function opLoadLocalAddress(IContext ctx) public {
        opLoadLocal(ctx, "getStorageAddress(bytes32)");
    }

    function opLoadRemoteUint256(IContext ctx) public {
        opLoadRemote(ctx, "getStorageUint256(bytes32)");
    }

    function opLoadRemoteBytes32(IContext ctx) public {
        opLoadRemote(ctx, "getStorageBytes32(bytes32)");
    }

    function opLoadRemoteBool(IContext ctx) public {
        opLoadRemote(ctx, "getStorageBool(bytes32)");
    }

    function opLoadRemoteAddress(IContext ctx) public {
        opLoadRemote(ctx, "getStorageAddress(bytes32)");
    }

    function opBool(IContext ctx) public {
        bytes memory data = nextBytes(ctx, 1);
        putUint256ToStack(ctx, uint256(uint8(data[0])));
    }

    function opUint256(IContext ctx) public {
        putUint256ToStack(ctx, opUint256Get(ctx));
    }

    function opSendEth(IContext ctx) public {
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(ctx, "getStorageAddress(bytes32)"))))
        );
        uint256 amount = opUint256Get(ctx);
        recipient.transfer(amount);
        putUint256ToStack(ctx, 1);
    }

    function opTransfer(IContext ctx) public {
        address token = opAddressGet(ctx);
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(ctx, "getStorageAddress(bytes32)"))))
        );
        uint256 amount = opUint256Get(ctx);
        // console.log("token");
        // console.log(token);
        // console.log("recipient");
        // console.log(recipient);
        // console.log("amount");
        // console.log(amount);

        IERC20(token).transfer(recipient, amount);

        putUint256ToStack(ctx, 1);
    }

    function opTransferFrom(IContext ctx) public {
        address payable token = payable(address(uint160(uint256(opLoadLocalGet(ctx, "getStorageAddress(bytes32)")))));
        address payable from = payable(address(uint160(uint256(opLoadLocalGet(ctx, "getStorageAddress(bytes32)")))));
        address payable to = payable(address(uint160(uint256(opLoadLocalGet(ctx, "getStorageAddress(bytes32)")))));
        uint256 amount = opUint256Get(ctx);
        // console.log("token");
        // console.log(token);
        // console.log("from");
        // console.log(from);
        // console.log("to");
        // console.log(to);
        // console.log("amount");
        // console.log(amount);

        IERC20(token).transferFrom(from, to, amount);

        putUint256ToStack(ctx, 1);
    }

    function opUint256Get(IContext ctx) private returns (uint256) {
        bytes memory data = nextBytes(ctx, 32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint256(result);
    }

    function putUint256ToStack(IContext ctx, uint256 result) private {
        StackValue resultValue = new StackValue();
        resultValue.setUint256(result);
        ctx.stack().push(resultValue);
    }

    function nextBytes(IContext ctx, uint256 size) private returns (bytes memory out) {
        out = ctx.programAt(ctx.pc(), size);
        ctx.incPc(size);
    }

    function nextBytes1(IContext ctx) private returns (bytes1) {
        return nextBytes(ctx, 1)[0];
    }

    function nextBranchSelector(IContext ctx, string memory baseOpName) private returns (bytes4) {
        bytes1 branchCode = nextBytes1(ctx);
        return ctx.branchSelectors(baseOpName, branchCode);
    }

    function mustCall(address addr, bytes memory data) private {
        (bool success, ) = address(addr).call(data);
        require(success, "call not success");
    }

    function opLoadLocalGet(IContext ctx, string memory funcSignature) private returns (bytes32 result) {
        bytes memory varName = nextBytes(ctx, 4);

        // Convert bytes to bytes32
        bytes32 varNameB32;
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }

        // Load local value by it's hex
        (bool success, bytes memory data) = ctx.appAddress().call(abi.encodeWithSignature(funcSignature, varNameB32));
        require(success, "Can't call a function");

        // Convert bytes to bytes32
        assembly {
            result := mload(add(data, 0x20))
        }
    }

    function opAddressGet(IContext ctx) private returns (address) {
        bytes memory contractAddrBytes = nextBytes(ctx, 20);

        // Convert bytes to bytes32
        bytes32 contractAddrB32;
        assembly {
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

        return address(uint160(uint256(contractAddrB32)));
    }

    function opLoadLocal(IContext ctx, string memory funcSignature) private {
        bytes32 result = opLoadLocalGet(ctx, funcSignature);
        putUint256ToStack(ctx, uint256(result));
    }

    function opLoadRemote(IContext ctx, string memory funcSignature) private {
        bytes memory varName = nextBytes(ctx, 4);
        bytes memory contractAddrBytes = nextBytes(ctx, 20);

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

        putUint256ToStack(ctx, uint256(result));
    }
}
