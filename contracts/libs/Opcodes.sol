// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from "../interfaces/IContext.sol";
import { IStorage } from "../interfaces/IStorage.sol";
import { IERC20 } from "../interfaces/IERC20.sol";
import { UnstructuredStorage } from "./UnstructuredStorage.sol";
import { StackValue } from "../helpers/Stack.sol";
import "hardhat/console.sol";

library Opcodes {
    using UnstructuredStorage for bytes32;

    function opLoadLocalAny(IContext _ctx) public {
        address libAddr = _ctx.opcodes();
        bytes4 selector = nextBranchSelector(_ctx, "loadLocal");
        mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
    }

    function opLoadRemoteAny(IContext _ctx) public {
        address libAddr = _ctx.opcodes();
        bytes4 selector = nextBranchSelector(_ctx, "loadRemote");
        mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), "Opcodes: type mismatch");

        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = last.getUint256() == prev.getUint256();
        }

        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), "Opcodes: type mismatch");

        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = last.getUint256() != prev.getUint256();
        }

        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), "Opcodes: type mismatch");
        bool result = false;
        if (last.getType() == StackValue.StackType.UINT256) {
            result = prev.getUint256() < last.getUint256();
        }

        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
     */
    function opGt(IContext _ctx) public {
        opSwap(_ctx);
        opLt(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
     */
    function opLe(IContext _ctx) public {
        opGt(_ctx);
        opNot(_ctx);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
     */
    function opGe(IContext _ctx) public {
        opLt(_ctx);
        opNot(_ctx);
    }

    /**
     * @dev Swaps two last element in the stack
     */
    function opSwap(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();
        _ctx.stack().push(last);
        _ctx.stack().push(prev);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if both of them are 1, put
     *      0 otherwise
     */
    function opAnd(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();
        require(
            last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256,
            "Opcodes: bad types"
        );
        bool result = (prev.getUint256() > 0) && (last.getUint256() > 0);
        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();
        require(
            last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256,
            "Opcodes: bad types"
        );
        bool result = (prev.getUint256() > 0) || (last.getUint256() > 0);
        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    function opXor(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();
        require(
            last.getType() == prev.getType() && last.getType() == StackValue.StackType.UINT256,
            "Opcodes: bad types"
        );
        bool result = ((prev.getUint256() > 0) && (last.getUint256() == 0)) ||
            ((prev.getUint256() == 0) && (last.getUint256() > 0));
        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        require(last.getType() == StackValue.StackType.UINT256, "Opcodes: opNot requires uint256");
        bool result = last.getUint256() == 0;
        putUint256ToStack(_ctx, result ? 1 : 0);
    }

    function opBlockNumber(IContext _ctx) public {
        putUint256ToStack(_ctx, block.number);
    }

    function opBlockTimestamp(IContext _ctx) public {
        putUint256ToStack(_ctx, block.timestamp);
    }

    function opBlockChainId(IContext _ctx) public {
        putUint256ToStack(_ctx, block.chainid);
    }

    function opMsgSender(IContext _ctx) public {
        putUint256ToStack(_ctx, uint256(uint160(_ctx.msgSender())));
    }

    function opLoadLocalUint256(IContext _ctx) public {
        opLoadLocal(_ctx, "getStorageUint256(bytes32)");
    }

    function opLoadLocalBytes32(IContext _ctx) public {
        opLoadLocal(_ctx, "getStorageBytes32(bytes32)");
    }

    function opLoadLocalBool(IContext _ctx) public {
        opLoadLocal(_ctx, "getStorageBool(bytes32)");
    }

    function opLoadLocalAddress(IContext _ctx) public {
        opLoadLocal(_ctx, "getStorageAddress(bytes32)");
    }

    function opLoadRemoteUint256(IContext _ctx) public {
        opLoadRemote(_ctx, "getStorageUint256(bytes32)");
    }

    function opLoadRemoteBytes32(IContext _ctx) public {
        opLoadRemote(_ctx, "getStorageBytes32(bytes32)");
    }

    function opLoadRemoteBool(IContext _ctx) public {
        opLoadRemote(_ctx, "getStorageBool(bytes32)");
    }

    function opLoadRemoteAddress(IContext _ctx) public {
        opLoadRemote(_ctx, "getStorageAddress(bytes32)");
    }

    function opBool(IContext _ctx) public {
        bytes memory data = nextBytes(_ctx, 1);
        putUint256ToStack(_ctx, uint256(uint8(data[0])));
    }

    function opUint256(IContext _ctx) public {
        putUint256ToStack(_ctx, opUint256Get(_ctx));
    }

    function opSendEth(IContext _ctx) public {
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, "getStorageAddress(bytes32)"))))
        );
        uint256 amount = opUint256Get(_ctx);
        // console.log("recipient:", recipient);
        // console.log("amount:", amount);
        recipient.transfer(amount);
        putUint256ToStack(_ctx, 1);
    }

    function opTransfer(IContext _ctx) public {
        address token = opAddressGet(_ctx);
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, "getStorageAddress(bytes32)"))))
        );
        uint256 amount = opUint256Get(_ctx);
        // console.log("token");
        // console.log(token);
        // console.log("recipient");
        // console.log(recipient);
        // console.log("amount");
        // console.log(amount);

        IERC20(token).transfer(recipient, amount);

        putUint256ToStack(_ctx, 1);
    }

    function opTransferFrom(IContext _ctx) public {
        address payable token = payable(address(uint160(uint256(opLoadLocalGet(_ctx, "getStorageAddress(bytes32)")))));
        address payable from = payable(address(uint160(uint256(opLoadLocalGet(_ctx, "getStorageAddress(bytes32)")))));
        address payable to = payable(address(uint160(uint256(opLoadLocalGet(_ctx, "getStorageAddress(bytes32)")))));
        uint256 amount = opUint256Get(_ctx);
        // console.log("token");
        // console.log(token);
        // console.log("from");
        // console.log(from);
        // console.log("to");
        // console.log(to);
        // console.log("amount");
        // console.log(amount);

        IERC20(token).transferFrom(from, to, amount);

        putUint256ToStack(_ctx, 1);
    }

    function opUint256Get(IContext _ctx) private returns (uint256) {
        bytes memory data = nextBytes(_ctx, 32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint256(result);
    }

    function putUint256ToStack(IContext _ctx, uint256 result) private {
        StackValue resultValue = new StackValue();
        resultValue.setUint256(result);
        _ctx.stack().push(resultValue);
    }

    function nextBytes(IContext _ctx, uint256 size) private returns (bytes memory out) {
        out = _ctx.programAt(_ctx.pc(), size);
        _ctx.incPc(size);
    }

    function nextBytes1(IContext _ctx) private returns (bytes1) {
        return nextBytes(_ctx, 1)[0];
    }

    function nextBranchSelector(IContext _ctx, string memory baseOpName) private returns (bytes4) {
        bytes1 branchCode = nextBytes1(_ctx);
        return _ctx.branchSelectors(baseOpName, branchCode);
    }

    function mustCall(address addr, bytes memory data) private {
        (bool success, ) = addr.delegatecall(data);
        // if (!success) console.log("Opcodes: call not success");
        require(success, "Opcodes: call not success");
    }

    function opLoadLocalGet(IContext _ctx, string memory funcSignature) private returns (bytes32 result) {
        bytes memory varName = nextBytes(_ctx, 4);

        // Convert bytes to bytes32
        bytes32 varNameB32;
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }

        // Load local value by it's hex
        (bool success, bytes memory data) = _ctx.appAddress().call(abi.encodeWithSignature(funcSignature, varNameB32));
        require(success, "Opcodes: call not success");

        // Convert bytes to bytes32
        assembly {
            result := mload(add(data, 0x20))
        }
    }

    function opAddressGet(IContext _ctx) private returns (address) {
        bytes memory contractAddrBytes = nextBytes(_ctx, 20);

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

    function opLoadLocal(IContext _ctx, string memory funcSignature) private {
        bytes32 result = opLoadLocalGet(_ctx, funcSignature);
        putUint256ToStack(_ctx, uint256(result));
    }

    function opLoadRemote(IContext _ctx, string memory funcSignature) private {
        bytes memory varName = nextBytes(_ctx, 4);
        bytes memory contractAddrBytes = nextBytes(_ctx, 20);

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
        require(success, "Opcodes: call not success");

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        // console.log("variable =", uint256(result));

        putUint256ToStack(_ctx, uint256(result));
    }
}
