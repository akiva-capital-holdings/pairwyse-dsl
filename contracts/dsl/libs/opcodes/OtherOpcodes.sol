// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from '../../interfaces/IContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

import 'hardhat/console.sol';

library OtherOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opLoadRemoteAny(address _ctx) public {
        address libAddr = IContext(_ctx).otherOpcodes();
        bytes4 selector = OpcodeHelpers.nextBranchSelector(_ctx, 'loadRemote');
        OpcodeHelpers.mustCall(libAddr, abi.encodeWithSelector(selector, _ctx));
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

    /**
     * @dev Sets boolean variable in the application contract.
     * The value of bool variable is taken from DSL code itself
     */
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

    /**
     * @dev Sets uint256 variable in the application contract. The value of the variable is taken from stack
     */
    function opSetUint256(address _ctx) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);
        uint256 _val = IContext(_ctx).stack().pop();

        // Set local variable by it's hex
        (bool success, ) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('setStorageUint256(bytes32,uint256)', _varNameB32, _val)
        );
        require(success, ErrorsGeneralOpcodes.OP1);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    /**
     * @dev Gets an element by its index in the array
     * @param _ctx Context contract instance address
     */
    function opGet(address _ctx) public {
        uint256 _index = opUint256Get(_ctx);
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // check if the array exists
        (bool success, bytes memory data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );

        require(success, ErrorsGeneralOpcodes.OP1);
        require(bytes1(data) != bytes1(0x0), ErrorsGeneralOpcodes.OP2);
        (success, data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(
                'get(uint256,bytes32)',
                _index, // index of the searched item
                _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
            )
        );
        require(success, ErrorsGeneralOpcodes.OP1);

        OpcodeHelpers.putToStack(_ctx, uint256(bytes32(data)));
    }

    /**
     * @dev Sums uin256 elements from the array (array name should be provided)
     * @param _ctx Context contract instance address
     */
    function opSumOf(address _ctx) public {
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        _checkArrType(_ctx, _arrNameB32, 'uint256');
        bytes32 _length = _getArrLength(_ctx, _arrNameB32);
        // sum items and store into the stack
        uint256 total = _sumOfVars(_ctx, _arrNameB32, _length);
        OpcodeHelpers.putToStack(_ctx, total);
    }

    /**
     * @dev Sums struct variables values from the `struct type` array
     * @param _ctx Context contract instance address
     */
    function opSumThroughStructs(address _ctx) public {
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);
        _checkArrType(_ctx, _arrNameB32, 'struct');
        bytes32 _length = _getArrLength(_ctx, _arrNameB32);
        // sum items and store into the stack
        uint256 total = _sumOfStructVars(_ctx, _arrNameB32, bytes4(_varNameB32), _length);
        OpcodeHelpers.putToStack(_ctx, total);
    }

    /**
     * @dev Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
     * Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
     * variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
     * the structs parameters
     * @param _ctx Context contract instance address
     */
    function opStruct(address _ctx) public {
        // get the first variable name
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // till found the `endStruct` opcode
        while (bytes4(_varNameB32) != 0xcb398fe1) {
            // get a variable value for current _varNameB32
            bytes32 _value = OpcodeHelpers.getNextBytes(_ctx, 32);

            (bool success, ) = IContext(_ctx).appAddr().call(
                abi.encodeWithSignature(
                    'setStorageUint256(bytes32,uint256)',
                    _varNameB32,
                    uint256(_value)
                )
            );
            require(success, ErrorsGeneralOpcodes.OP1);

            // get the next variable name in struct
            _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);
        }
    }

    /**
     * @dev Inserts an item to array
     * @param _ctx Context contract instance address
     */
    function opPush(address _ctx) public {
        bytes32 _varValue = OpcodeHelpers.getNextBytes(_ctx, 32);
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        // check if the array exists
        (bool success, bytes memory data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(success, ErrorsGeneralOpcodes.OP1);
        require(bytes1(data) != bytes1(0x0), ErrorsGeneralOpcodes.OP4);

        (success, ) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(
                'addItem(bytes32,bytes32)',
                _varValue, // value that pushes to the array
                _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
            )
        );
        require(success, ErrorsGeneralOpcodes.OP1);
    }

    /**
     * @dev Declares an empty array
     * @param _ctx Context contract instance address
     */
    function opDeclare(address _ctx) public {
        bytes32 _arrType = OpcodeHelpers.getNextBytes(_ctx, 1);
        bytes32 _arrName = OpcodeHelpers.getNextBytes(_ctx, 4);

        (bool success, ) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(
                'declare(bytes1,bytes32)',
                bytes1(_arrType), // type of the array
                _arrName
            )
        );
        require(success, ErrorsGeneralOpcodes.OP1);
    }

    function opLoadLocalUint256(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageUint256(bytes32)');
    }

    function opLoadLocalAddress(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageAddress(bytes32)');
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
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctx);
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opTransferVar(address _ctx) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctx, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = uint256(opLoadLocalGet(_ctx, 'getStorageUint256(bytes32)'));
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    function opTransferFrom(address _ctx) public {
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
        OpcodeHelpers.putToStack(_ctx, balance);
    }

    function opLengthOf(address _ctx) public {
        uint256 _length = uint256(opLoadLocalGet(_ctx, 'getLength(bytes32)'));
        OpcodeHelpers.putToStack(_ctx, _length);
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

    function opEnableRecord(address _ctx) public {
        bytes memory recordId = OpcodeHelpers.nextBytes(_ctx, 32);
        bytes memory contractAddrBytes = OpcodeHelpers.nextBytes(_ctx, 20);
        bytes32 contractAddrB32 = bytes32(contractAddrBytes);

        /**
         * Shift bytes to the left so that
         * later conversion from bytes32 to address
         */
        contractAddrB32 >>= 96;
        address contractAddr = address(uint160(uint256(contractAddrB32)));
        console.log(contractAddr);
        (bool success, ) = contractAddr.delegatecall(
            abi.encodeWithSignature('activateRecord(uint256)', uint256(bytes32(recordId)))
        );

        require(success, ErrorsGeneralOpcodes.OP3);
        OpcodeHelpers.putToStack(_ctx, 1);
    }

    /**
     * @dev Sums struct variables values from the `struct type` array
     * @param _ctx Context contract instance address
     * @param _arrNameB32 Array's name in bytecode
     * @param _varName Struct's name in bytecode
     * @param _length Array's length in bytecode
     * @return total Total sum of each element in the `struct` type of array
     */
    function _sumOfStructVars(
        address _ctx,
        bytes32 _arrNameB32,
        bytes4 _varName,
        bytes32 _length
    ) internal returns (uint256 total) {
        bool success;
        for (uint256 i = 0; i < uint256(_length); i++) {
            // get the name of a struct
            bytes memory item = _getItem(_ctx, i, _arrNameB32);

            // get struct variable value
            bytes4 _fullName = IContext(_ctx).structParams(bytes4(item), _varName);
            (success, item) = IContext(_ctx).appAddr().call(
                abi.encodeWithSignature('getStorageUint256(bytes32)', _fullName)
            );
            require(success, ErrorsGeneralOpcodes.OP5);
            total += uint256(bytes32(item));
        }
    }

    /**
     * @dev Returns the element from the array
     * @param _ctx Context contract instance address
     * @param _index Array's index
     * @param _arrNameB32 Array's name in bytecode
     * @return item Item from the array by its index
     */
    function _getItem(
        address _ctx,
        uint256 _index,
        bytes32 _arrNameB32
    ) internal returns (bytes memory) {
        (bool success, bytes memory item) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('get(uint256,bytes32)', _index, _arrNameB32)
        );
        require(success, ErrorsGeneralOpcodes.OP1);
        return item;
    }

    /**
     * @dev Sums uin256 elements from the array (array name should be provided)
     * @param _ctx Context contract instance address
     * @param _arrNameB32 Array's name in bytecode
     * @param _length Array's length in bytecode
     * @return total Total sum of each element in the `uint256` type of array
     */
    function _sumOfVars(
        address _ctx,
        bytes32 _arrNameB32,
        bytes32 _length
    ) internal returns (uint256 total) {
        for (uint256 i = 0; i < uint256(_length); i++) {
            bytes memory item = _getItem(_ctx, i, _arrNameB32);
            total += uint256(bytes32(item));
        }
    }

    /**
     * @dev Checks the type for array
     * @param _ctx Context contract instance address
     * @param _arrNameB32 Array's name in bytecode
     * @param _typeName Type of the array, ex. `uint256`, `address`, `struct`
     */
    function _checkArrType(
        address _ctx,
        bytes32 _arrNameB32,
        string memory _typeName
    ) internal {
        bool success;
        bytes memory _type;
        // check if the array exists
        (success, _type) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(success, ErrorsGeneralOpcodes.OP1);
        require(
            bytes1(_type) == IContext(_ctx).branchCodes('declareArr', _typeName),
            ErrorsGeneralOpcodes.OP8
        );
    }

    /**
     * @dev Returns array's length
     * @param _ctx Context contract instance address
     * @param _arrNameB32 Array's name in bytecode
     * @return Array's length in bytecode
     */
    function _getArrLength(address _ctx, bytes32 _arrNameB32) internal returns (bytes32) {
        (bool success, bytes memory data) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getLength(bytes32)', _arrNameB32)
        );
        require(success, ErrorsGeneralOpcodes.OP1);
        return bytes32(data);
    }
}
