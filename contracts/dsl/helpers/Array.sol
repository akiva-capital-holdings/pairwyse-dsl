// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// import { ErrorsArray } from '../libs/Errors.sol';
import '../interfaces/IArray.sol';
import { StringUtils } from '../libs/StringUtils.sol';

// import 'hardhat/console.sol';

contract Array is IArray {
    using StringUtils for string;

    mapping(bytes32 => ArrayObj) public arrays; // name => array object
    mapping(bytes32 => bool) public isArray;

    /**
     * Get all uint256 values from the array
     */
    function getUint256Array(bytes32 _name) public view returns (uint256[] memory) {
        return arrays[_name].uint256Values;
    }

    /**
     * Get all address values from the array
     */
    function getAddressArray(bytes32 _name) public view returns (address[] memory) {
        return arrays[_name].addressValues;
    }

    /**
     * Get uint256 value from the array by certain index
     */
    function getUint256ByIndex(bytes32 _name, uint256 _index) public view returns (uint256) {
        require(isArray[_name], 'ARR1');

        ArrayObj memory obj = arrays[_name];
        require(obj._type.equal('uint256'), 'ARR4');
        require(obj.uint256Values.length > 0, 'ARR3');
        require(_index < obj.uint256Values.length, 'ARR2');
        return obj.uint256Values[_index];
    }

    /**
     * Get address value from the array by certain index
     */
    function getAddressByIndex(bytes32 _name, uint256 _index) public view returns (address) {
        require(isArray[_name], 'ARR1');

        ArrayObj memory obj = arrays[_name];
        require(obj._type.equal('address'), 'ARR4');
        require(obj.addressValues.length > 0, 'ARR3');
        require(_index < obj.addressValues.length, 'ARR2');
        return obj.addressValues[_index];
    }

    /**
     * Push a new uint256 value to the array
     */
    function pushUint256(bytes32 _name, uint256 _value) public {
        require(isArray[_name], 'ARR1');

        ArrayObj memory obj;
        uint256 _last = obj.uint256Values.length;
        obj.uint256Values[_last] = _value;
    }

    /**
     * Push a new address to the array
     */
    function pushUint256(bytes32 _name, address _address) public {
        require(isArray[_name], 'ARR1');

        ArrayObj memory obj;
        uint256 _last = obj.addressValues.length;
        obj.addressValues[_last] = _address;
    }

    /**
     * Set uin256 values to the array
     */
    function setArrayUint256(bytes32 _name, uint256[] memory _values) public {
        require(_values.length > 0, 'ARR3');
        isArray[_name] = true;

        ArrayObj memory obj;
        obj._type = 'uint256';
        obj.uint256Values = _values;
        arrays[_name] = obj;
    }

    /**
     * Set address values to the array
     */
    function setArrayAddresses(bytes32 _name, address[] memory _addresses) public {
        require(_addresses.length > 0, 'ARR3');
        isArray[_name] = true;

        ArrayObj memory obj;
        obj._type = 'address';
        for (uint256 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0), 'ARR5');
        }
        obj.addressValues = _addresses;
        arrays[_name] = obj;
    }
}
