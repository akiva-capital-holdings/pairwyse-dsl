// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IParser } from '../dsl/interfaces/IParser.sol';
import { IContext } from '../dsl/interfaces/IContext.sol';
import { Context } from '../dsl/Context.sol';
import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { ComparisonOpcodes } from '../dsl/libs/opcodes/ComparisonOpcodes.sol';
import { BranchingOpcodes } from '../dsl/libs/opcodes/BranchingOpcodes.sol';
import { LogicalOpcodes } from '../dsl/libs/opcodes/LogicalOpcodes.sol';
import { OtherOpcodes } from '../dsl/libs/opcodes/OtherOpcodes.sol';
import { Executor } from '../dsl/libs/Executor.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';

import 'hardhat/console.sol';

// TODO: automatically make sure that no contract exceeds the maximum contract size

/**
 * Financial Agreement written in DSL between two or more users
 *
 * Agreement contract that is used to implement any custom logic of a
 * financial agreement. Ex. lender-borrower agreement
 */
contract AgreementStore {
    using StringUtils for string;

    IParser public parser; // TODO: We can get rid of this dependency
    IContext public context;
    address public ownerAddr;
    enum ValueTypes {
        UINT256,
        BYTES32,
        BOOL,
        ADDRESS
    }

    event Parsed(address indexed preProccessor, address indexed context, string code);

    event RecordArchived(uint256 indexed recordId);
    event RecordUnarchived(uint256 indexed recordId);
    event RecordActivated(uint256 indexed recordId);
    event RecordDeactivated(uint256 indexed recordId);

    modifier isReserved(string memory varName) {
        bytes32 position = bytes4(keccak256(abi.encodePacked(varName)));
        bytes32 MSG_SENDER_4_BYTES_HEX = 0x9ddd6a8100000000000000000000000000000000000000000000000000000000;
        bytes32 ETH_4_BYTES_HEX = 0xaaaebeba00000000000000000000000000000000000000000000000000000000;
        bytes32 GWEI_4_BYTES_HEX = 0x0c93a5d800000000000000000000000000000000000000000000000000000000;
        require(position != MSG_SENDER_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable is not 'MSG_SENDER'
        require(position != ETH_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable name is not 'ETH'
        require(position != GWEI_4_BYTES_HEX, ErrorsAgreement.AGR8); // check that variable name is not 'GWEI'
        _;
    }

    modifier doesVariableExist(string memory varName, ValueTypes valueType) {
        for (uint256 i = 0; i <= varIds.length; i++) {
            // check that value already exist
            if (varName.equal(variables[i].varName)) {
                // check that msg.sender can rewrite variable
                console.log(valueType == variables[i].valueType);
                require(
                    msg.sender == variables[i].varCreator && valueType == variables[i].valueType,
                    ErrorsAgreement.AGR8
                );
            }
        }
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == ownerAddr, ErrorsAgreement.AGR11);
        _;
    }

    struct Variable {
        string varName; // Name of variable
        ValueTypes valueType; // Type of variable
        bytes32 varHex; // Name of variable in type of bytes32
        uint256 varId; // Id of variable
        address varCreator; // address of owner
    }

    mapping(uint256 => Variable) public variables; // varId => Variable struct
    mapping(uint256 => address[]) public conditionContexts; // recordId => condition Context
    mapping(uint256 => string[]) public conditionStrings; // recordId => DSL condition as string
    mapping(uint256 => address[]) public signatories; // recordId => signatories
    mapping(uint256 => uint256[]) public requiredRecords; // recordId => requiredRecords[]
    // recordId => (signatory => was tx executed by signatory)
    mapping(uint256 => mapping(address => bool)) public isExecutedBySignatory;
    uint256[] public recordIds; // array of recordId
    uint256[] public varIds; // array of variable Ids

    /**
     * Sets parser address, creates new Context instance, and setups Context
     */
    constructor(address _parser, address _ownerAddr) {
        require(_ownerAddr != address(0), ErrorsAgreement.AGR12);
        ownerAddr = _ownerAddr;
        parser = IParser(_parser);
        context = new Context();
        context.setAppAddress(address(this));
    }

    // function getStorageBool(bytes32 position) external view returns (bool data) {
    //     return position.getStorageBool();
    // }

    // function getStorageAddress(bytes32 position) external view returns (address data) {
    //     return position.getStorageAddress();
    // }

    // function getStorageUint256(bytes32 position) external view returns (uint256 data) {
    //     return position.getStorageUint256();
    // }

    // function setStorageBool(
    //     string memory varName,
    //     bool data
    // ) external isReserved(varName) doesVariableExist(varName, ValueTypes.BOOL) {
    //     bytes32 position = _addNewVariable(varName, ValueTypes.BOOL);
    //     position.setStorageBool(data);
    // }

    // function setStorageAddress(
    //     string memory varName,
    //     address data
    // ) external isReserved(varName) doesVariableExist(varName, ValueTypes.ADDRESS) {
    //     bytes32 position = _addNewVariable(varName, ValueTypes.ADDRESS);
    //     setStorageAddress(position, data);
    // }

    function setStorage(uint varType, string memory varName, address[] memory data) external {
        bytes32 position = bytes4(keccak256(abi.encodePacked(varName)));
        uint alala = uint(ValueTypes.ADDRESS);
        bytes4 arrType = bytes4(keccak256(abi.encodePacked(ValueTypes.ADDRESS)));
        bytes4 valueType = bytes4(keccak256(abi.encodePacked(varType)));
        uint256 pos = uint(position) + 4;
        bytes32 pospos = bytes4(keccak256(abi.encodePacked(varType)));
        console.log(pos);
        console.logBytes4(valueType);
        console.logBytes4(arrType);
        console.logBytes32(position);

        assembly {
            // sstore(position, add(add(valueType, arrType),position))
            sstore(pospos, valueType)
            sstore(pospos, arrType)
            sstore(pospos, pos)
            // sstore(position, add(valueType,arrType))
        }
    }

    function getStorage(
        string memory varName
    ) external returns (bytes32 varType, bytes memory arrType, bytes32 name) {
        bytes32 position = bytes4(keccak256(abi.encodePacked(varName)));
        //    bytes memory valueType = abi.encodePacked(ValueTypes.ADDRESS);
        //    uint varTypeSlot = 0;
        //    uint arrTypeSlot = 1;
        //    uint nameSlot = 33;
        assembly {
            varType := sload(position)
            arrType := sload(add(position, 4))
            name := sload(add(position, 8))
        }
        console.logBytes32(varType);
        // console.logBytes(arrType);
        // console.logBytes32(name);
    }

    // function setStorageBytes32(
    //     string memory varName,
    //     bytes32 data
    // ) external isReserved(varName) doesVariableExist(varName, ValueTypes.BYTES32) {
    //     bytes32 position = _addNewVariable(varName, ValueTypes.BYTES32);
    //     position.setStorageBytes32(data);
    // }

    // function setStorageUint256(
    //     string memory varName,
    //     uint256 data
    // ) external isReserved(varName) doesVariableExist(varName, ValueTypes.UINT256) {
    //     bytes32 position = _addNewVariable(varName, ValueTypes.UINT256);
    //     position.setStorageUint256(data);
    // }

    /**
     * @dev Created and save new Variable of seted Value
     * @param _varName seted value name in type of string
     * @param _valueType seted value type number
     * @return position return _varName in type of bytes32
     */
    function _addNewVariable(
        string memory _varName,
        ValueTypes _valueType
    ) internal returns (bytes32 position) {
        position = bytes4(keccak256(abi.encodePacked(_varName)));
        uint256 arrPos = varIds.length;
        varIds.push(arrPos);
        Variable memory variable = Variable(_varName, _valueType, position, arrPos, msg.sender);
        variables[arrPos] = variable;
    }
}
