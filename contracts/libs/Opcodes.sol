// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../interfaces/IContext.sol';
import { IStorage } from '../interfaces/IStorage.sol';
import { IERC20 } from '../interfaces/IERC20.sol';
import { StringUtils } from './StringUtils.sol';
import { UnstructuredStorage } from './UnstructuredStorage.sol';
import { StackValue } from '../helpers/Stack.sol';

// import 'hardhat/console.sol';

library Opcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    // function opLoadLocalAny(IContext _ctx) public {
    //     address libAddr = _ctx.opcodes();
    //     bytes4 selector = nextBranchSelector(_ctx, 'loadLocal');
    //     mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
    // }

    // function opLoadRemoteAny(IContext _ctx) public {
    //     address libAddr = _ctx.opcodes();
    //     bytes4 selector = nextBranchSelector(_ctx, 'loadRemote');
    //     mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
    // }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
     */
    function opEq(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = last.getUint256() == prev.getUint256();

        putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
     */
    function opNotEq(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = last.getUint256() != prev.getUint256();

        putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
     */
    function opLt(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = prev.getUint256() < last.getUint256();

        putToStack(_ctx, result ? 1 : 0);
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

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = (prev.getUint256() > 0) && (last.getUint256() > 0);

        putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Compares two values in the stack. Put 1 if either one of them is 1,
     *      put 0 otherwise
     */
    function opOr(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = (prev.getUint256() > 0) || (last.getUint256() > 0);

        putToStack(_ctx, result ? 1 : 0);
    }

    function opXor(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();
        StackValue prev = _ctx.stack().pop();

        require(last.getType() == prev.getType(), 'Opcodes: type mismatch');
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = ((prev.getUint256() > 0) && (last.getUint256() == 0)) ||
            ((prev.getUint256() == 0) && (last.getUint256() > 0));

        putToStack(_ctx, result ? 1 : 0);
    }

    /**
     * @dev Revert last value in the stack
     */
    function opNot(IContext _ctx) public {
        StackValue last = _ctx.stack().pop();

        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type');

        bool result = last.getUint256() == 0;

        putToStack(_ctx, result ? 1 : 0);
    }

    function opBlockNumber(IContext _ctx) public {
        putToStack(_ctx, block.number);
    }

    function opBlockTimestamp(IContext _ctx) public {
        putToStack(_ctx, block.timestamp);
    }

    function opBlockChainId(IContext _ctx) public {
        putToStack(_ctx, block.chainid);
    }

    function opMsgSender(IContext _ctx) public {
        putToStack(_ctx, uint256(uint160(_ctx.msgSender())));
    }

    function opMsgValue(IContext _ctx) public {
        putToStack(_ctx, uint256(uint160(_ctx.msgValue())));
    }

    function opSetLocalBool(IContext _ctx) public {
        opSetLocal(_ctx, 'setStorageBool(bytes32,bool)');
    }

    function opBnz(IContext _ctx) public {
        // console.log('opBnz');
        if (_ctx.stack().length() == 0) {
            // console.log('notihing in the stack');
            putToStack(_ctx, 0); // for if-else condition to work all the time
        }

        StackValue last = _ctx.stack().pop();
        require(last.getType() == StackValue.StackType.UINT256, 'Opcodes: bad type in the stack');

        uint16 _offsetFalseBranch = opUint16Get(_ctx);
        // console.log('offset (false) =', _offsetFalseBranch);
        uint16 _offsetCode = opUint16Get(_ctx);
        // console.log('offset (code) =', _offsetCode);

        // console.log('pc =', _ctx.pc());
        _ctx.setNextPc(_ctx.pc() + _offsetCode);

        if (last.getUint256() > 0) {
            // console.log('if condition is true');
            _ctx.setPc(_ctx.pc());
        } else {
            // console.log('if condition is false');
            _ctx.setPc(_ctx.pc() + _offsetFalseBranch);
        }
    }

    function opEnd(IContext _ctx) public {
        _ctx.setPc(_ctx.nextpc());
        _ctx.setNextPc(0);
    }

    // function opLoadLocalUint256(IContext _ctx) public {
    //     opLoadLocal(_ctx, 'getStorageUint256(bytes32)');
    // }

    // function opLoadLocalBytes32(IContext _ctx) public {
    //     opLoadLocal(_ctx, 'getStorageBytes32(bytes32)');
    // }

    // function opLoadLocalBool(IContext _ctx) public {
    //     opLoadLocal(_ctx, 'getStorageBool(bytes32)');
    // }

    // function opLoadLocalAddress(IContext _ctx) public {
    //     opLoadLocal(_ctx, 'getStorageAddress(bytes32)');
    // }

    // function opLoadRemoteUint256(IContext _ctx) public {
    //     opLoadRemote(_ctx, 'getStorageUint256(bytes32)');
    // }

    // function opLoadRemoteBytes32(IContext _ctx) public {
    //     opLoadRemote(_ctx, 'getStorageBytes32(bytes32)');
    // }

    // function opLoadRemoteBool(IContext _ctx) public {
    //     opLoadRemote(_ctx, 'getStorageBool(bytes32)');
    // }

    // function opLoadRemoteAddress(IContext _ctx) public {
    //     opLoadRemote(_ctx, 'getStorageAddress(bytes32)');
    // }

    function opBool(IContext _ctx) public {
        bytes memory data = nextBytes(_ctx, 1);
        putToStack(_ctx, uint256(uint8(data[0])));
    }

    function opUint256(IContext _ctx) public {
        putToStack(_ctx, opUint256Get(_ctx));
    }

    function opSendEth(IContext _ctx) public {
        // address payable recipient = payable(
        //     address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        // );
        // uint256 amount = opUint256Get(_ctx);
        // recipient.transfer(amount);
        // putToStack(_ctx, 1);
    }

    function opTransfer(IContext _ctx) public {
        // address token = opAddressGet(_ctx);
        // address payable recipient = payable(
        //     address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        // );
        // uint256 amount = opUint256Get(_ctx);
        // IERC20(token).transfer(recipient, amount);
        // putToStack(_ctx, 1);
    }

    function opTransferFrom(IContext _ctx) public {
        // address payable token = payable(
        //     address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        // );
        // address payable from = payable(
        //     address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        // );
        // address payable to = payable(
        //     address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        // );
        // uint256 amount = opUint256Get(_ctx);
        // IERC20(token).transferFrom(from, to, amount);
        // putToStack(_ctx, 1);
    }

    function opUint16Get(IContext _ctx) public returns (uint16) {
        bytes memory data = nextBytes(_ctx, 2);

        // Convert bytes to bytes8
        bytes2 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint16(result);
    }

    function opUint256Get(IContext _ctx) public returns (uint256) {
        bytes memory data = nextBytes(_ctx, 32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint256(result);
    }

    function putToStack(IContext _ctx, uint256 _value) public {
        StackValue resultValue = new StackValue();
        resultValue.setUint256(_value);
        _ctx.stack().push(resultValue);
    }

    // function putToStack(IContext _ctx, string memory _value) public {
    //     StackValue resultValue = new StackValue();
    //     resultValue.setString(_value);
    //     _ctx.stack().push(resultValue);
    // }

    // function putToStack(IContext _ctx, address _value) public {
    //     StackValue resultValue = new StackValue();
    //     resultValue.setAddress(_value);
    //     _ctx.stack().push(resultValue);
    // }

    function nextBytes(IContext _ctx, uint256 size) public returns (bytes memory out) {
        out = _ctx.programAt(_ctx.pc(), size);
        _ctx.incPc(size);
    }

    function nextBytes1(IContext _ctx) public returns (bytes1) {
        return nextBytes(_ctx, 1)[0];
    }

    function nextBranchSelector(IContext _ctx, string memory baseOpName) public returns (bytes4) {
        bytes1 branchCode = nextBytes1(_ctx);
        return _ctx.branchSelectors(baseOpName, branchCode);
    }

    function mustCall(address addr, bytes memory data) public {
        (bool success, ) = addr.delegatecall(data);
        require(success, 'Opcodes: mustCall call not success');
    }

    function getNextBytes(IContext _ctx, uint256 _bytesNum) public returns (bytes32 varNameB32) {
        bytes memory varName = nextBytes(_ctx, _bytesNum);

        // Convert bytes to bytes32
        assembly {
            varNameB32 := mload(add(varName, 0x20))
        }
    }

    function opSetLocal(IContext _ctx, string memory _funcSignature) public {
        bytes32 _varNameB32 = getNextBytes(_ctx, 4);

        bytes memory data = nextBytes(_ctx, 1);
        bool _boolVal = uint8(data[0]) == 1;

        // Set local variable by it's hex
        (bool success, ) = _ctx.appAddress().call(
            abi.encodeWithSignature(_funcSignature, _varNameB32, _boolVal)
        );
        require(success, 'Opcodes: opSetLocal call not success');
        putToStack(_ctx, 1);
    }

    // function opLoadLocalGet(IContext _ctx, string memory funcSignature)
    //     public
    //     returns (bytes32 result)
    // {
    //     bytes32 varNameB32 = getNextBytes(_ctx, 4);

    //     // Load local variable by it's hex
    //     (bool success, bytes memory data) = _ctx.appAddress().call(
    //         abi.encodeWithSignature(funcSignature, varNameB32)
    //     );
    //     require(success, 'Opcodes: opLoadLocal call not success');

    //     // Convert bytes to bytes32
    //     assembly {
    //         result := mload(add(data, 0x20))
    //     }
    // }

    function opAddressGet(IContext _ctx) public returns (address) {
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

        return address(uint160(uint256(contractAddrB32)));
    }

    // function opLoadLocal(IContext _ctx, string memory funcSignature) public {
    //     bytes32 result = opLoadLocalGet(_ctx, funcSignature);
    //     putToStack(_ctx, uint256(result));
    // }

    // function opLoadRemote(IContext _ctx, string memory funcSignature) public {
    //     bytes memory varName = nextBytes(_ctx, 4);
    //     bytes memory contractAddrBytes = nextBytes(_ctx, 20);

    //     // Convert bytes to bytes32
    //     bytes32 varNameB32;
    //     bytes32 contractAddrB32;
    //     assembly {
    //         varNameB32 := mload(add(varName, 0x20))
    //         contractAddrB32 := mload(add(contractAddrBytes, 0x20))
    //     }
    //     /**
    //      * Shift bytes to the left so that
    //      * 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512000000000000000000000000
    //      * transforms into
    //      * 0x000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512
    //      * This is needed to later conversion from bytes32 to address
    //      */
    //     contractAddrB32 >>= 96;

    //     address contractAddr = address(uint160(uint256(contractAddrB32)));

    //     // Load local value by it's hex
    //     (bool success, bytes memory data) = contractAddr.call(
    //         abi.encodeWithSignature(funcSignature, varNameB32)
    //     );
    //     require(success, 'Opcodes: opLoadRemote call not success');

    //     // Convert bytes to bytes32
    //     bytes32 result;
    //     assembly {
    //         result := mload(add(data, 0x20))
    //     }

    //     putToStack(_ctx, uint256(result));
    // }
}
