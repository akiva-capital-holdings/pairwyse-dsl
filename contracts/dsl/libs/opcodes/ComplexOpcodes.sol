// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IDSLContext } from '../../interfaces/IDSLContext.sol';
import { IProgramContext } from '../../interfaces/IProgramContext.sol';
import { IERC20 } from '../../interfaces/IERC20.sol';
import { IcToken } from '../../interfaces/IcToken.sol';
import { UnstructuredStorage } from '../UnstructuredStorage.sol';
import { OpcodeHelpers } from './OpcodeHelpers.sol';
import { ErrorsGeneralOpcodes } from '../Errors.sol';

// import 'hardhat/console.sol';

/**
 * @dev You should add to this file opcodes for some complex structures. These may be arrays, structs and others
 */
library ComplexOpcodes {
    /***************
     * Load Remote *
     **************/
    function opLoadRemoteAny(address _ctxProgram, address _ctxDSL) public {
        _mustDelegateCall(_ctxProgram, _ctxDSL, 'loadRemote');
    }

    function opLoadRemoteUint256(address _ctxProgram, address) public {
        _opLoadRemote(_ctxProgram, 'getStorageUint256(bytes32)');
    }

    function opLoadRemoteBytes32(address _ctxProgram, address) public {
        _opLoadRemote(_ctxProgram, 'getStorageBytes32(bytes32)');
    }

    function opLoadRemoteBool(address _ctxProgram, address) public {
        _opLoadRemote(_ctxProgram, 'getStorageBool(bytes32)');
    }

    function opLoadRemoteAddress(address _ctxProgram, address) public {
        _opLoadRemote(_ctxProgram, 'getStorageAddress(bytes32)');
    }

    /**********
     * Arrays *
     *********/

    /**
     * @dev Declares an empty array
     * @param _ctxProgram ProgramContext contract address
     */
    function opDeclare(address _ctxProgram, address) public {
        bytes32 _arrType = OpcodeHelpers.getNextBytes32(_ctxProgram, 1);
        bytes32 _arrName = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

        OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature(
                'declare(bytes1,bytes32)',
                bytes1(_arrType), // type of the array
                _arrName
            )
        );
    }

    /**
     * @dev Inserts an item to array
     * @param _ctxProgram ProgramContext contract address
     */
    function opPush(address _ctxProgram, address) public {
        bytes32 MSG_SENDER = 0x9ddd6a8100000000000000000000000000000000000000000000000000000000;
        bytes32 _varValue = OpcodeHelpers.getNextBytes32(_ctxProgram, 32);
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

        // check if the array exists
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('getType(bytes32)', _arrNameB32)
        );
        require(bytes1(data) != bytes1(0x0), ErrorsGeneralOpcodes.OP4);

        // if pushed MSG_SENDER to array of address, will push address of msg.sender in bytes32
        if (bytes1(data) == bytes1(0x03) && _varValue == MSG_SENDER) {
            bytes32 addressInBytes32 = bytes32(
                uint256(uint160(IProgramContext(_ctxProgram).msgSender())) << 96
            );
            OpcodeHelpers.addItemToArray(_ctxProgram, addressInBytes32, _arrNameB32);
        } else {
            OpcodeHelpers.addItemToArray(_ctxProgram, _varValue, _arrNameB32);
        }
    }

    /**
     * @dev Gets an element by its index in the array
     * @param _ctxProgram ProgramContext contract address
     */
    function opGet(address _ctxProgram, address) public {
        uint256 _index = OpcodeHelpers.getUint256(_ctxProgram, address(0));
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

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
     * @dev Get length of an array
     * @param _ctxProgram ProgramContext contract address
     */
    function opLengthOf(address _ctxProgram, address) public {
        uint256 _length = uint256(OpcodeHelpers.getLocalVar(_ctxProgram, 'getLength(bytes32)'));
        OpcodeHelpers.putToStack(_ctxProgram, _length);
    }

    /**
     * @dev Sums uin256 elements from the array (array name should be provided)
     * @param _ctxDSL DSLContext contract instance address
     * @param _ctxProgram ProgramContext contract address
     */
    function opSumOf(address _ctxProgram, address _ctxDSL) public {
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

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
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

        _checkArrType(_ctxDSL, _ctxProgram, _arrNameB32, 'struct');
        bytes32 _length = _getArrLength(_ctxProgram, _arrNameB32);
        // sum items and store into the stack
        uint256 total = _sumOfStructVars(_ctxProgram, _arrNameB32, bytes4(_varNameB32), _length);
        OpcodeHelpers.putToStack(_ctxProgram, total);
    }

    /**
     * @dev Finds a sum of all tokens of users in the array
     * @param _ctxProgram ProgramContext contract address
     */
    function opVotersBalance(address _ctxProgram, address) public {
        uint256 total;
        address payable token = payable(
            address(
                uint160(
                    uint256(OpcodeHelpers.getLocalVar(_ctxProgram, 'getStorageAddress(bytes32)'))
                )
            )
        );
        bytes32 _arrNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        bytes32 _length = _getArrLength(_ctxProgram, _arrNameB32);
        require(uint256(_length) > 0, ErrorsGeneralOpcodes.OP6);
        for (uint256 i = 0; i < uint256(_length); i++) {
            bytes memory data = OpcodeHelpers.mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature(
                    'get(uint256,bytes32)',
                    i, // index of the searched item
                    _arrNameB32 // array name, ex. INDEX_LIST, PARTNERS
                )
            );
            address voterAddress = address(uint160(bytes20(data)));
            uint256 balance = IERC20(token).balanceOf(voterAddress);
            total += balance;
        }
        OpcodeHelpers.putToStack(_ctxProgram, total);
    }

    /***********
     * Structs *
     **********/

    /**
     * @dev Inserts items to DSL structures using mixed variable name (ex. `BOB.account`).
     * Struct variable names already contain a name of a DSL structure, `.` dot symbol, the name of
     * variable. `endStruct` word (0xcb398fe1) is used as an indicator for the ending loop for
     * the structs parameters
     * @param _ctxProgram ProgramContext contract address
     */
    function opStruct(address _ctxProgram, address) public {
        // get the first variable name
        bytes32 _varNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);

        // till found the `endStruct` opcode
        while (bytes4(_varNameB32) != 0xcb398fe1) {
            // get a variable value for current _varNameB32
            bytes32 _value = OpcodeHelpers.getNextBytes32(_ctxProgram, 32);
            OpcodeHelpers.mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature(
                    'setStorageUint256(bytes32,uint256)',
                    _varNameB32,
                    uint256(_value)
                )
            );
            // get the next variable name in struct
            _varNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        }
    }

    /************************
     * Compound Integration *
     ***********************/

    /**
     * @dev Master opcode to interact with Compound V2. Needs sub-commands to be executed
     * @param _ctxProgram ProgramContext contract address
     * @param _ctxDSL DSLContext contract address
     */
    function opCompound(address _ctxProgram, address _ctxDSL) public {
        _mustDelegateCall(_ctxProgram, _ctxDSL, 'compound');
    }

    /**
     * Sub-command of Compound V2. Makes a deposit of funds to Compound V2
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundDeposit(address _ctxProgram) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        address cToken = address(uint160(uint256(bytes32(data))));
        uint256 balance = IcToken(token).balanceOf(address(this));
        // approve simple token to use it into the market
        IERC20(token).approve(cToken, balance);
        // supply assets into the market and receives cTokens in exchange
        IcToken(cToken).mint(balance);

        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**
     * Sub-command of Compound V2. Makes a withdrawal of funds to Compound V2
     * @param _ctxProgram ProgramContext contract address
     */
    function opCompoundWithdraw(address _ctxProgram) public {
        address payable token = payable(OpcodeHelpers.getAddress(_ctxProgram));
        // `token` can be used in the future for more different underluing tokens
        bytes memory data = OpcodeHelpers.mustCall(
            IProgramContext(_ctxProgram).appAddr(),
            abi.encodeWithSignature('compounds(address)', token)
        );
        address cToken = address(uint160(uint256(bytes32(data))));

        // redeems cTokens in exchange for the underlying asset (USDC)
        // amount - amount of cTokens
        IcToken(cToken).redeem(IcToken(cToken).balanceOf(address(this)));

        OpcodeHelpers.putToStack(_ctxProgram, 1);
    }

    /**********************
     * Internal functions *
     *********************/

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
     * @dev Loads a variable value from another smart contract
     * @param _ctxProgram ProgramContext contract address
     * @param _funcSignature Signature of the "read" function
     */
    function _opLoadRemote(address _ctxProgram, string memory _funcSignature) internal {
        bytes32 varNameB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 4);
        bytes32 contractAddrB32 = OpcodeHelpers.getNextBytes32(_ctxProgram, 20);

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
            abi.encodeWithSignature(_funcSignature, varNameB32)
        );

        OpcodeHelpers.putToStack(_ctxProgram, uint256(bytes32(data)));
    }

    /**
     * @dev Makes a delegate call and ensures it is successful
     * @param _ctxProgram ProgramContext contract address
     * @param _ctxDSL DSLContext contract address
     * @param _opcode Opcode string
     */
    function _mustDelegateCall(
        address _ctxProgram,
        address _ctxDSL,
        string memory _opcode
    ) internal {
        address libAddr = IDSLContext(_ctxDSL).complexOpcodes();
        bytes4 _selector = OpcodeHelpers.nextBranchSelector(_ctxDSL, _ctxProgram, _opcode);
        OpcodeHelpers.mustDelegateCall(
            libAddr,
            abi.encodeWithSelector(_selector, _ctxProgram, _ctxDSL)
        );
    }

    /**
     * @dev Returns array's length
     * @param _ctxProgram ProgramContext contract address
     * @param _arrNameB32 Array's name in bytecode
     * @return result Array's length in bytecode
     */
    function _getArrLength(
        address _ctxProgram,
        bytes32 _arrNameB32
    ) internal returns (bytes32 result) {
        result = bytes32(
            OpcodeHelpers.mustCall(
                IProgramContext(_ctxProgram).appAddr(),
                abi.encodeWithSignature('getLength(bytes32)', _arrNameB32)
            )
        );
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
}
