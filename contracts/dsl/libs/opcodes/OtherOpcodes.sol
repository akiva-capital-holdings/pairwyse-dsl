// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from '../../interfaces/IDSLContext.sol';
import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { StringUtils } from '../StringUtils.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

library OtherOpcodes {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    function opLoadRemoteAny(address _ctxProgram, address _ctxDSL) public {
        address libAddr = IDSLContext(_ctxDSL).otherOpcodes();
        bytes4 selector = OpcodeHelpers.nextBranchSelector(_ctxDSL, _ctxProgram, 'loadRemote');
        OpcodeHelpers.mustDelegateCall(libAddr, abi.encodeWithSelector(selector, _ctxDSL));
    }

    function opBlockNumber(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, block.number);
    }

    function opBlockTimestamp(address _ctxProgram, address) public {
        // console.log(123);
        OpcodeHelpers.putToStack(_ctxProgram, block.timestamp);
    }

    function opBlockChainId(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, block.chainid);
    }

    function opMsgSender(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(
            _ctxProgram,
            uint256(uint160(IProgramContext(_ctxProgram).msgSender()))
        );
    }

    function opMsgValue(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(
            _ctxProgram,
            uint256(uint160(IProgramContext(_ctxProgram).msgValue()))
        );
    }

    /**
     * @dev Sets boolean variable in the application contract.
     * The value of bool variable is taken from DSL code itself
     * @param _ctxProgram ProgramContext contract address
     */
    function opSetLocalBool(address _ctxProgram, address) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        bytes memory data = OpcodeHelpers.nextBytes(_ctxProgram, 1);
        bool _boolVal = uint8(data[0]) == 1;

        // Set local variable by it's hex
        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('setStorageBool(bytes32,bool)', _varNameB32, _boolVal)
        );
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * @dev Sets uint256 variable in the application contract. The value of the variable is taken from stack
     * @param _ctxProgram ProgramContext contract address
     */
    function opSetUint256(address _ctxProgram, address) public {
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);
        uint256 _val = IProgramContext(_ctxProgram).stack().pop();

        // Set local variable by it's hex
        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('setStorageUint256(bytes32,uint256)', _varNameB32, _val)
        );
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * @dev Gets an element by its index in the array
     * @param _ctxProgram ProgramContext contract address
     */
    function opGet(address _ctxProgram, address) public {
        uint256 _index = opUint256Get(_ctxProgram, address(0));
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        // check if the array exists
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(bytes1(data) != bytes1(0x0), ErrorsGeneralOpcodes.OP2);
        (data) = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature(
                'get(uint256,bytes32)',
                _index, // index of the searched item
                _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
            )
        );
        OpcodeHelpers.putToStack(_ctxProgram, uint256(bytes32(data)));
    }

    /**
     * @dev Sums uin256 elements from the array (array name should be provided)
     * @param _ctxDSL DSLContext contract instance address
     * @param _ctxProgram ProgramContext contract address
     */
    function opSumOf(address _ctxProgram, address _ctxDSL) public {
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        _checkArrType(_ctxDSL, _ctxProgram, _arrNameB32, 'uint256');
        bytes32 _length = _getArrLength(_ctxProgram, _arrNameB32);
        // sum items and store into the stack
        uint256 total = _sumOfVars(_ctxProgram, _arrNameB32, _length);
        OpcodeHelpers.putToStack(_ctxProgram, total);
    }

    /**
     * @dev Sums struct variables values from the `struct type` array
     * @param _ctxDSL DSLContext contract instance address
     * @param _ctxProgram ProgramContext contract address
     */
    function opSumThroughStructs(address _ctxProgram, address _ctxDSL) public {
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        _checkArrType(_ctxDSL, _ctxProgram, _arrNameB32, 'struct');
        bytes32 _length = _getArrLength(_ctxProgram, _arrNameB32);
        // sum items and store into the stack
        uint256 total = _sumOfStructVars(_ctxProgram, _arrNameB32, bytes4(_varNameB32), _length);

        OpcodeHelpers.putToStack(_ctxProgram, total);
    }

    /**
     * @dev Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
     * Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
     * variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
     * the structs parameters
     * @param _ctxProgram ProgramContext contract address
     */
    function opStruct(address _ctxProgram, address) public {
        // get the first variable name
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        // till found the `endStruct` opcode
        while (bytes4(_varNameB32) != 0xcb398fe1) {
            // get a variable value for current _varNameB32
            bytes32 _value = OpcodeHelpers.getNextBytes(_ctxProgram, 32);
            OpcodeHelpers.mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature(
                    'setStorageUint256(bytes32,uint256)',
                    _varNameB32,
                    uint256(_value)
                )
            );
            // get the next variable name in struct
            _varNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);
        }
    }

    /**
     * @dev Inserts an item to array
     * @param _ctxProgram ProgramContext contract address
     */
    function opPush(address _ctxProgram, address) public {
        bytes32 _varValue = OpcodeHelpers.getNextBytes(_ctxProgram, 32);
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        // check if the array exists
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(bytes1(data) != bytes1(0x0), ErrorsGeneralOpcodes.OP4);
        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature(
                'addItem(bytes32,bytes32)',
                _varValue, // value that pushes to the array
                _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
            )
        );
    }

    /**
     * @dev Declares an empty array
     * @param _ctxProgram ProgramContext contract address
     */
    function opDeclare(address _ctxProgram, address) public {
        bytes32 _arrType = OpcodeHelpers.getNextBytes(_ctxProgram, 1);
        bytes32 _arrName = OpcodeHelpers.getNextBytes(_ctxProgram, 4);

        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature(
                'declare(bytes1,bytes32)',
                bytes1(_arrType), // type of the array
                _arrName
            )
        );
    }

    function opLoadLocalUint256(address _ctxProgram, address) public {
        opLoadLocal(_ctxProgram, 'getStorageUint256(bytes32)');
    }

    function opLoadLocalAddress(address _ctxProgram, address) public {
        opLoadLocal(_ctxProgram, 'getStorageAddress(bytes32)');
    }

    function opLoadRemoteUint256(address _ctxProgram, address) public {
        opLoadRemote(_ctxProgram, 'getStorageUint256(bytes32)');
    }

    function opLoadRemoteBytes32(address _ctxProgram, address) public {
        opLoadRemote(_ctxProgram, 'getStorageBytes32(bytes32)');
    }

    function opLoadRemoteBool(address _ctxProgram, address) public {
        opLoadRemote(_ctxProgram, 'getStorageBool(bytes32)');
    }

    function opLoadRemoteAddress(address _ctxProgram, address) public {
        opLoadRemote(_ctxProgram, 'getStorageAddress(bytes32)');
    }

    function opBool(address _ctxProgram, address) public {
        bytes memory data = OpcodeHelpers.nextBytes(_ctxProgram, 1);
        OpcodeHelpers.putToStack(_ctxProgram, uint256(uint8(data[0])));
    }

    function opUint256(address _ctxProgram, address) public {
        OpcodeHelpers.putToStack(_ctxProgram, opUint256Get(_ctxProgram, address(0)));
    }

    function opSendEth(address _ctxProgram, address) public {
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctxProgram, address(0));
        recipient.transfer(amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opTransfer(address _ctxProgram, address) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctxProgram, address(0));
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opTransferVar(address _ctxProgram, address) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable recipient = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = uint256(opLoadLocalGet(_ctxProgram, 'getStorageUint256(bytes32)'));
        IERC20(token).transfer(recipient, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opTransferFrom(address _ctxProgram, address) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable from = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable to = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = opUint256Get(_ctxProgram, address(0));
        IERC20(token).transferFrom(from, to, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opBalanceOf(address _ctxProgram, address) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable user = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        uint256 balance = IERC20(token).balanceOf(user);
        OpcodeHelpers.putToStack(_ctxProgram, balance);
    }

    function opLengthOf(address _ctxProgram, address) public {
        uint256 _length = uint256(opLoadLocalGet(_ctxProgram, 'getLength(bytes32)'));
        OpcodeHelpers.putToStack(_ctxProgram, _length);
    }

    function opTransferFromVar(address _ctxProgram, address) public {
        address payable token = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable from = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        address payable to = payable(
            address(uint160(uint256(opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)'))))
        );
        uint256 amount = uint256(opLoadLocalGet(_ctxProgram, 'getStorageUint256(bytes32)'));

        IERC20(token).transferFrom(from, to, amount);
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    function opUint256Get(address _ctxProgram, address) public returns (uint256) {
        bytes memory data = OpcodeHelpers.nextBytes(_ctxProgram, 32);

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        return uint256(result);
    }

    function opLoadLocalGet(
        address _ctxProgram,
        string memory funcSignature
    ) public returns (bytes32 result) {
        bytes32 MSG_SENDER = 0x9ddd6a8100000000000000000000000000000000000000000000000000000000;
        bytes memory data;
        bytes32 varNameB32 = OpcodeHelpers.getNextBytes(_ctxProgram, 4);
        if (varNameB32 == MSG_SENDER) {
            data = abi.encode(IProgramContext(_ctxProgram).msgSender());
        } else {
            // Load local variable by it's hex
            data = OpcodeHelpers.mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature(funcSignature, varNameB32)
            );
        }

        // Convert bytes to bytes32
        assembly {
            result := mload(add(data, 0x20))
        }
    }

    function opAddressGet(address _ctxProgram, address) public returns (address) {
        bytes memory contractAddrBytes = OpcodeHelpers.nextBytes(_ctxProgram, 20);

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

    function opLoadLocal(address _ctxProgram, string memory funcSignature) public {
        bytes32 result = opLoadLocalGet(_ctxProgram, funcSignature);
        OpcodeHelpers.putToStack(_ctxProgram, uint256(result));
    }

    function opLoadRemote(address _ctxProgram, string memory funcSignature) public {
        bytes memory varName = OpcodeHelpers.nextBytes(_ctxProgram, 4);
        bytes memory contractAddrBytes = OpcodeHelpers.nextBytes(_ctxProgram, 20);

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
        bytes memory data = OpcodeHelpers.mustCall(
            contractAddr,
            abi.encodeWithSignature(funcSignature, varNameB32)
        );
        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data, 0x20))
        }

        OpcodeHelpers.putToStack(_ctxProgram, uint256(result));
    }

    function opEnableRecord(address _ctxProgram, address) public {
        bytes32 result = opLoadLocalGet(_ctxProgram, 'getStorageUint256(bytes32)');

        uint256 recordId = uint256(result);
        bytes32 addr = opLoadLocalGet(_ctxProgram, 'getStorageAddress(bytes32)');

        address payable contractAddr = payable(address(uint160(uint256(addr))));

        OpcodeHelpers.mustCall(
            contractAddr,
            abi.encodeWithSignature('activateRecord(uint256)', recordId)
        );
        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * @dev Sums struct variables values from the `struct type` array
     * @param _ctxProgram ProgramContext contract address
     * @param _arrNameB32 Array's name in bytecode
     * @param _varName Struct's name in bytecode
     * @param _length Array's length in bytecode
     * @return total Total sum of each element in the `struct` type of array
     */
    function _sumOfStructVars(
        address _ctxProgram,
        bytes32 _arrNameB32,
        bytes4 _varName,
        bytes32 _length
    ) internal returns (uint256 total) {
        for (uint256 i = 0; i < uint256(_length); i++) {
            // get the name of a struct
            bytes memory item = _getItem(_ctxProgram, i, _arrNameB32);

            // get struct variable value
            bytes4 _fullName = IProgramContext(_ctxProgram).structParams(bytes4(item), _varName);
            (item) = OpcodeHelpers.mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature('getStorageUint256(bytes32)', bytes32(_fullName))
            );
            total += uint256(bytes32(item));
        }
    }

    /**
     * @dev Returns the element from the array
     * @param _ctxProgram ProgramContext contract address
     * @param _index Array's index
     * @param _arrNameB32 Array's name in bytecode
     * @return item Item from the array by its index
     */
    function _getItem(
        address _ctxProgram,
        uint256 _index,
        bytes32 _arrNameB32
    ) internal returns (bytes memory item) {
        item = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('get(uint256,bytes32)', _index, _arrNameB32)
        );
    }

    /**
     * @dev Sums uin256 elements from the array (array name should be provided)
     * @param _ctxProgram ProgramContext contract address
     * @param _arrNameB32 Array's name in bytecode
     * @param _length Array's length in bytecode
     * @return total Total sum of each element in the `uint256` type of array
     */
    function _sumOfVars(
        address _ctxProgram,
        bytes32 _arrNameB32,
        bytes32 _length
    ) internal returns (uint256 total) {
        for (uint256 i = 0; i < uint256(_length); i++) {
            bytes memory item = _getItem(_ctxProgram, i, _arrNameB32);
            total += uint256(bytes32(item));
        }
    }

    /**
     * @dev Checks the type for array
     * @param _ctxDSL DSLContext contract address
     * @param _ctxProgram ProgramContext contract address
     * @param _arrNameB32 Array's name in bytecode
     * @param _typeName Type of the array, ex. `uint256`, `address`, `struct`
     */
    function _checkArrType(
        address _ctxDSL,
        address _ctxProgram,
        bytes32 _arrNameB32,
        string memory _typeName
    ) internal {
        bytes memory _type;
        // check if the array exists
        (_type) = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(
            bytes1(_type) == IDSLContext(_ctxDSL).branchCodes('declareArr', _typeName),
            ErrorsGeneralOpcodes.OP8
        );
    }

    /**
     * @dev Returns array's length
     * @param _ctxProgram ProgramContext contract address
     * @param _arrNameB32 Array's name in bytecode
     * @return Array's length in bytecode
     */
    function _getArrLength(address _ctxProgram, bytes32 _arrNameB32) internal returns (bytes32) {
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('getLength(bytes32)', _arrNameB32)
        );
        return bytes32(data);
    }
}
