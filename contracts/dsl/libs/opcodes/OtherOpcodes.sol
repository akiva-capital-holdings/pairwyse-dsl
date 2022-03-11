// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IStorage } from '../../interfaces/IStorage.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';

import 'hardhat/console.sol';

library OtherOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opLoadLocalAny(IContext _ctx) public {
        address libAddr = _ctx.otherOpcodes();
        bytes4 selector = OpcodeHelpers.nextBranchSelector(_ctx, 'loadLocal');
        OpcodeHelpers.mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
    }

    function opLoadRemoteAny(IContext _ctx) public {
        address libAddr = _ctx.otherOpcodes();
        bytes4 selector = OpcodeHelpers.nextBranchSelector(_ctx, 'loadRemote');
        OpcodeHelpers.mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
    }

    function opBlockNumber(IContext _ctx) public {
        OpcodeHelpers.putToStack(_ctx, block.number);
    }

    function opBlockTimestamp(IContext _ctx) public {
        OpcodeHelpers.putToStack(_ctx, block.timestamp);
    }

    function opBlockChainId(IContext _ctx) public {
        OpcodeHelpers.putToStack(_ctx, block.chainid);
    }

    function opMsgSender(IContext _ctx) public {
        OpcodeHelpers.putToStack(_ctx, uint256(uint160(_ctx.msgSender())));
    }

    function opMsgValue(IContext _ctx) public {
        OpcodeHelpers.putToStack(_ctx, uint256(uint160(_ctx.msgValue())));
    }

    function opSetLocalBool(IContext _ctx) public {
        opSetLocal(_ctx, 'setStorageBool(bytes32,bool)');
    }

    function opLoadLocalUint256(IContext _ctx) public {
        opLoadLocal(_ctx, 'getStorageUint256(bytes32)');
    }

    function opLoadLocalBytes32(IContext _ctx) public {
        opLoadLocal(_ctx, 'getStorageBytes32(bytes32)');
    }

    function opLoadLocalBool(IContext _ctx) public {
        opLoadLocal(_ctx, 'getStorageBool(bytes32)');
    }

    function opLoadLocalAddress(IContext _ctx) public {
        opLoadLocal(_ctx, 'getStorageAddress(bytes32)');
    }

    function opLoadRemoteUint256(IContext _ctx) public {
        opLoadRemote(_ctx, 'getStorageUint256(bytes32)');
    }

    function opLoadRemoteBytes32(IContext _ctx) public {
        opLoadRemote(_ctx, 'getStorageBytes32(bytes32)');
    }

    function opLoadRemoteBool(IContext _ctx) public {
        opLoadRemote(_ctx, 'getStorageBool(bytes32)');
    }

    function opLoadRemoteAddress(IContext _ctx) public {
        opLoadRemote(_ctx, 'getStorageAddress(bytes32)');
    }

    function opBool(IContext _ctx) public {
        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 1);
        OpcodeHelpers.putToStack(_ctx, uint256(uint8(data[0])));
    }

    function opUint256(IContext _ctx) public {
        OpcodeHelpers.putToStack(_ctx, opUint256Get(_ctx));
    }

    function opSendEth(IContext _ctx) public {
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctx);
        recipient.transfer(amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    // TODO: get token address from variable, not from the address itself in string as a parameter
    function opTransfer(IContext _ctx) public {
        // console.log('opTransfer');
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        // console.log('token', token);
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        // console.log('recipient', recipient);
        uint256 amount = opUint256Get(_ctx);
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opTransferFrom(IContext _ctx) public {
        // console.log('opTransferFrom');
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable from = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable to = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctx);
        // console.log('token', token);
        // console.log('from', from);
        // console.log('to', to);
        IERC20(token).transferFrom(from, to, amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opUint256Get(IContext _ctx) public returns (uint256) {
        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint256(result);
    }

    function opSetLocal(IContext _ctx, string memory _funcSignature) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 1);
        bool _boolVal = uint8(data[0]) == 1;

        // Set local variable by it's hex
        (bool success, ) = _ctx.appAddress().call(
            abi.encodeWithSignature(_funcSignature, _varNameB32, _boolVal)
        );
        require(success, 'Opcodes: opSetLocal call not success');
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opLoadLocalGet(IContext _ctx, string memory funcSignature)
        public
        returns (bytes32 result)
    {
        bytes32 varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // Load local variable by it's hex
        (bool success, bytes memory data) = _ctx.appAddress().call(
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        require(success, 'Opcodes: opLoadLocal call not success');

        // Convert bytes to bytes32
        assembly {
            result := mload(add(data, 0x20))
        }
    }

    function opAddressGet(IContext _ctx) public returns (address) {
        bytes memory contractAddrBytes = OpcodeHelpers.nextBytes(_ctx, 20);

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

    function opLoadLocal(IContext _ctx, string memory funcSignature) public {
        bytes32 result = opLoadLocalGet(_ctx, funcSignature);
        OpcodeHelpers.putToStack(_ctx, uint256(result));
    }

    function opLoadRemote(IContext _ctx, string memory funcSignature) public {
        bytes memory varName = OpcodeHelpers.nextBytes(_ctx, 4);
        bytes memory contractAddrBytes = OpcodeHelpers.nextBytes(_ctx, 20);

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

        address contractAddr = address(uint160(uint256(contractAddrB32)));

        // Load local value by it's hex
        (bool success, bytes memory data) = contractAddr.call(
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        require(success, 'Opcodes: opLoadRemote call not success');

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        OpcodeHelpers.putToStack(_ctx, uint256(result));
    }
}
