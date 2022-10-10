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
        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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

        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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
        require(bytes32(data) != bytes32(0x0), ErrorsGeneralOpcodes.OP2);
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
     * @dev Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
     * Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
     * variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
     * the structs parameters
     * @param _ctx Context contract instance address
     */
    function opStruct(address _ctx) public {
        // get the first variable name
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes(_ctx, 4);

        while (bytes4(_varNameB32) != 0xcb398fe1) {
            // searching endStruct opcode
            // get variable value for current _varNameB32
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

    function opForLoop(address _ctx) public {
        console.log('opForLoop');
        // Ex. [('for'), 'LP_INITIAL', 'in', 'LPS_INITIAL']
        bytes32 loopVarName = OpcodeHelpers.getNextBytes(_ctx, 4);
        console.logBytes32(loopVarName);
        // OpcodeHelpers.nextBytes(_ctx, 32); // skip `in` keyword as it is useless
        bytes32 arrName = OpcodeHelpers.getNextBytes(_ctx, 4);
        console.logBytes32(arrName);

        // check if the array exists
        (bool success1, bytes memory data1) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getType(bytes32)', arrName)
        );
        // TODO: these errors are as strings because I wanna check are the error names correct
        require(success1, 'ErrorsGeneralOpcodes.OP1');
        require(bytes32(data1) != bytes32(0x0), 'ErrorsGeneralOpcodes.OP4');

        /**
         * Get array length
         */
        // Load local variable by it's hex
        (bool success2, bytes memory data2) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature('getLength(bytes32)', arrName)
        );
        require(success2, 'ErrorsGeneralOpcodes.OP5');

        // Convert bytes to bytes32
        bytes32 result;
        assembly {
            result := mload(add(data2, 0x20))
        }
        uint256 arrLength = uint256(result);
        console.log(arrLength); // 3

        /**
         * opGet
         */
        for (uint256 i = 0; i < arrLength; i++) {
            console.log('i =', i);

            (bool success3, bytes memory data3) = IContext(_ctx).appAddr().call(
                abi.encodeWithSignature(
                    'get(uint256,bytes32)',
                    i, // index of the searched item
                    arrName // array name, ex. INDEX_LIST, PARTNERS
                )
            );
            require(success3, 'ErrorsGeneralOpcodes.OP1');

            address element; // element by index `i` from the array

            assembly {
                element := mload(add(data3, 20))
            }
            // 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
            // 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
            // 2: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
            console.log(element);
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
        require(bytes32(data) != bytes32(0x0), ErrorsGeneralOpcodes.OP4);

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
        // https://github.com/ethereum/solidity/releases/tag/v0.8.5
        bytes32 _varType = OpcodeHelpers.getNextBytes(_ctx, 1);
        bytes32 _arrName = OpcodeHelpers.getNextBytes(_ctx, 4);

        (bool success, ) = IContext(_ctx).appAddr().call(
            abi.encodeWithSignature(
                'declare(bytes32,bytes32)',
                _varType, // type of the array
                _arrName
            )
        );
        require(success, ErrorsGeneralOpcodes.OP1);
    }

    function opLoadLocalUint256(address _ctx) public {
        opLoadLocal(_ctx, 'getStorageUint256(bytes32)');
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
        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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
        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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
        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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
        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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
        OpcodeHelpers.putToStack(_ctx, 1); // TODO: remove
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
}
