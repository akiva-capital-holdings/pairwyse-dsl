// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { StackValue } from '../../helpers/Stack.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

library OtherOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opLoadLocalAny(address _ctx) public {
        _opLoadAny(_ctx, 'loadLocal');
    }

    function opLoadRemoteAny(address _ctx) public {
        _opLoadAny(_ctx, 'loadRemote');
    }

    function opLoadArrayAny(address _ctx) public {
        _opLoadAny(_ctx, 'loadArray');
    }

    function opBlockNumber(address _ctx) public {
        OpcodeHelpers.putToStack(_ctx, block.number);
    }

    function opBlockTimestamp(address _ctx) public {
        OpcodeHelpers.putToStack(_ctx, block.timestamp);
    }

    function opBlockChainId(address _ctx) public {
        OpcodeHelpers.putToStack(_ctx, block.chainid);
    }

    function opMsgSender(address _ctx) public {
        OpcodeHelpers.putToStack(_ctx, uint256(uint160(IContext(_ctx).msgSender())));
    }

    function opMsgValue(address _ctx) public {
        OpcodeHelpers.putToStack(_ctx, uint256(uint160(IContext(_ctx).msgValue())));
    }

    function opSetLocalBool(address _ctx) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 1);
        bool _boolVal = uint8(data[0]) == 1;

        // Set local variable by it's hex
        (bool success, ) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('setStorageBool(bytes32,bool)', _varNameB32, _boolVal)
        );
        require(success, ErrorsGeneralOpcodes.OP1);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opSetUint256(address _ctx) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        StackValue _last = IContext(_ctx).stack().pop();
        require(_last.getType() == StackValue.StackType.UINT256, ErrorsGeneralOpcodes.OP2);
        uint256 _val = _last.getUint256();

        // Set local variable by it's hex
        (bool success, ) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('setStorageUint256(bytes32,uint256)', _varNameB32, _val)
        );
        require(success, ErrorsGeneralOpcodes.OP1);

        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opLoadLocalUint256(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageUint256(bytes32)');
    }

    function opLoadLocalBytes32(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageBytes32(bytes32)');
    }

    function opLoadLocalBool(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageBool(bytes32)');
    }

    function opLoadLocalAddress(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageAddress(bytes32)');
    }

    function opLoadArrayUint256(address _ctx) public {
        opLoadArray(_ctx, 'getUint256ByIndex(bytes32,uint256)');
    }

    function opLoadArrayAddress(address _ctx) public {
        opLoadArray(_ctx, 'getAddressByIndex(bytes32,uint256)');
    }

    function opLoadArray(address _ctx, string memory funcSignature)
        public
        returns (bytes32 result)
    {
        bytes32 _name = OpcodeHelpers.getNextBytes(_ctx, 4);
        uint256 _index = uint256(OpcodeHelpers.getNextBytes(_ctx, 32));

        // Load array by index
        (bool success, bytes memory data) = _ctx.call(
            abi.encodeWithSignature(funcSignature, _name, _index)
        );
        require(success, ErrorsGeneralOpcodes.OP5);
        // Convert bytes to bytes32
        assembly {
            result := mload(add(data, 0x20))
        }
    }

    function opLoadRemoteUint256(address _ctx) public {
        opLoadRemote(_ctx, 'getStorageUint256(bytes32)');
    }

    function opLoadRemoteBytes32(address _ctx) public {
        opLoadRemote(_ctx, 'getStorageBytes32(bytes32)');
    }

    function opLoadRemoteBool(address _ctx) public {
        opLoadRemote(_ctx, 'getStorageBool(bytes32)');
    }

    function opLoadRemoteAddress(address _ctx) public {
        opLoadRemote(_ctx, 'getStorageAddress(bytes32)');
    }

    function opBool(address _ctx) public {
        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 1);
        OpcodeHelpers.putToStack(_ctx, uint256(uint8(data[0])));
    }

    function opUint256(address _ctx) public {
        OpcodeHelpers.putToStack(_ctx, opUint256Get(_ctx));
    }

    function opSendEth(address _ctx) public {
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctx);
        recipient.transfer(amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opTransfer(address _ctx) public {
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

    function opTransferVar(address _ctx) public {
        // console.log('opTransfer');
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        // console.log('token', token);
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        // console.log('recipient', recipient);
        uint256 amount = uint256(opLoadLocalGet(_ctx, 'getStorageUint256(bytes32)'));
        // console.log('balance contract before', IERC20(token).balanceOf(address(this)));
        // console.log('balance recipient before', IERC20(token).balanceOf(recipient));
        // console.log('amount', amount);
        IERC20(token).transfer(recipient, amount);
        // console.log('balance contract after', IERC20(token).balanceOf(address(this)));
        // console.log('balance recipient after', IERC20(token).balanceOf(recipient));
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opTransferFrom(address _ctx) public {
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

    function opBalanceOf(address _ctx) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable user = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 balance = IERC20(token).balanceOf(user);
        // console.log('balanceOf', balance);
        OpcodeHelpers.putToStack(_ctx, balance);
    }

    function opTransferFromVar(address _ctx) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable from = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable to = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = uint256(opLoadLocalGet(_ctx, 'getStorageUint256(bytes32)'));
        // console.log('token', token);
        // console.log('from', from);
        // console.log('to', to);
        // console.log('amount', amount);
        IERC20(token).transferFrom(from, to, amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opUint256Get(address _ctx) public returns (uint256) {
        bytes memory data = OpcodeHelpers.nextBytes(_ctx, 32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint256(result);
    }

    function opLoadLocalGet(address _ctx, string memory funcSignature)
        public
        returns (bytes32 result)
    {
        bytes32 varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // Load local variable by it's hex
        (bool success, bytes memory data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        require(success, ErrorsGeneralOpcodes.OP5);

        // Convert bytes to bytes32
        assembly {
            result := mload(add(data, 0x20))
        }
    }

    function opAddressGet(address _ctx) public returns (address) {
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

    function opLoadLocal(address _ctx, string memory funcSignature) public {
        bytes32 result = opLoadLocalGet(_ctx, funcSignature);
        // console.log('load local', uint256(result));
        OpcodeHelpers.putToStack(_ctx, uint256(result));
    }

    function opLoadRemote(address _ctx, string memory funcSignature) public {
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
        require(success, ErrorsGeneralOpcodes.OP3);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        OpcodeHelpers.putToStack(_ctx, uint256(result));
    }

    function _opLoadAny(address _ctx, string memory _name) internal {
        address libAddr = IContext(_ctx).otherOpcodes();
        bytes4 _selector = OpcodeHelpers.nextBranchSelector(_ctx, _name);
        OpcodeHelpers.mustCall(libAddr, abi.encodeWithSelector(_selector, _ctx));
    }
}
