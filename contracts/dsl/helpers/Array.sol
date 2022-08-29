// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// import { ErrorsArray } from '../libs/Errors.sol';
import '../interfaces/IArray.sol';
import { StringUtils } from '../libs/StringUtils.sol';

import 'hardhat/console.sol';

contract Array is IArray {
    mapping(string => ArrayObj) public arrays; // name=>array object. stores names of array and its content
    mapping(string => bool) public isArray;

    function getUint256Array(string memory _name) public view returns (uint256[] memory) {
        return arrays[_name].uint256Values;
    }

    function getAddressArray(string memory _name) public view returns (address[] memory) {
        return arrays[_name].addressValues;
    }

    function getAddressByIndex(string memory _name, uint256 _index) public view returns (address) {
        require(isArray[_name], 'err');
        ArrayObj memory obj = arrays[_name];
        require(obj.addressValues.length > 0, 'err');
        require(_index < obj.addressValues.length, 'err');
        return obj.addressValues[_index];
    }

    function setArrayAddresses(string memory _name, address[] memory _addresses) public {
        require(_addresses.length > 0, 'err');
        isArray[_name] = true;
        ArrayObj memory obj;
        obj._type = 'address';
        for (uint256 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0), 'err');
        }
        // console.log(_addresses[0], _addresses[1]);
        obj.addressValues = _addresses;
        arrays[_name] = obj;
    }

    function getUint256ByIndex(string memory _name, uint256 _index) public view returns (uint256) {
        require(isArray[_name], 'err');
        ArrayObj memory obj = arrays[_name];
        require(obj.uint256Values.length > 0, 'err');
        require(_index < obj.uint256Values.length, 'err');
        return obj.uint256Values[_index];
    }

    function setArrayUint256(string memory _name, uint256[] memory _values) public {
        require(_values.length > 0, 'err');
        isArray[_name] = true;
        ArrayObj memory obj;
        obj._type = 'uint256';
        obj.uint256Values = _values;
        arrays[_name] = obj;
    }

    // function getListUint256FromStr(string calldata _listStr) public returns (uint256[] memory) {
    //     return StringUtils.fromStrToUint256List(_listStr);
    // }
}
