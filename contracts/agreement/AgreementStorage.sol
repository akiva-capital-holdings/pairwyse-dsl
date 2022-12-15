// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ErrorsAgreement } from '../dsl/libs/Errors.sol';
import { UnstructuredStorage } from '../dsl/libs/UnstructuredStorage.sol';
import { StringUtils } from '../dsl/libs/StringUtils.sol';

// import 'hardhat/console.sol';

/**
 * AgreementStorage used to manage all variables
 */
contract AgreementStorage {
    using UnstructuredStorage for bytes32;
    using StringUtils for string;

    struct Variable {
        string varName; // Name of variable
        ValueTypes valueType; // Type of variable
        bytes32 varHex; // Name of variable in type of bytes32
        uint256 varId; // Id of variable
        address varCreator; // address of owner
    }

    mapping(uint256 => Variable) public variables; // varId => Variable struct

    enum ValueTypes {
        ADDRESS,
        UINT256,
        BYTES32,
        BOOL
    }

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
            if (StringUtils.equal(varName, variables[i].varName)) {
                // check that msg.sender can rewrite variable
                require(
                    msg.sender == variables[i].varCreator && valueType == variables[i].valueType,
                    ErrorsAgreement.AGR8
                );
            }
        }
        _;
    }

    uint256[] public varIds; // array of variable Ids

    function getStorageBool(bytes32 position) external view returns (bool data) {
        return position.getStorageBool();
    }

    function getStorageAddress(bytes32 position) external view returns (address data) {
        return position.getStorageAddress();
    }

    function getStorageUint256(bytes32 position) external view returns (uint256 data) {
        return position.getStorageUint256();
    }

    function setStorageBool(
        string memory varName,
        bool data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.BOOL) {
        bytes32 position = _addNewVariable(varName, ValueTypes.BOOL);
        position.setStorageBool(data);
    }

    function setStorageAddress(
        string memory varName,
        address data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.ADDRESS) {
        bytes32 position = _addNewVariable(varName, ValueTypes.ADDRESS);
        position.setStorageAddress(data);
    }

    function setStorageBytes32(
        string memory varName,
        bytes32 data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.BYTES32) {
        bytes32 position = _addNewVariable(varName, ValueTypes.BYTES32);
        position.setStorageBytes32(data);
    }

    function setStorageUint256(
        string memory varName,
        uint256 data
    ) external isReserved(varName) doesVariableExist(varName, ValueTypes.UINT256) {
        bytes32 position = _addNewVariable(varName, ValueTypes.UINT256);
        position.setStorageUint256(data);
    }

    /**
     * @dev Created and save new Variable of seted Value
     * @param _varName seted value name in type of string
     * @param _valueType seted value type number
     * @return position is a _varName in type of bytes32
     */
    function _addNewVariable(
        string memory _varName,
        ValueTypes _valueType
    ) internal returns (bytes32 position) {
        uint256 arrPos = varIds.length;
        varIds.push(arrPos);
        Variable memory variable = Variable(_varName, _valueType, position, arrPos, msg.sender);
        variables[arrPos] = variable;
        position = bytes4(keccak256(abi.encodePacked(_varName)));
    }
}
