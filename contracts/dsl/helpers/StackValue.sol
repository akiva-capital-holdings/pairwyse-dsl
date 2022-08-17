// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ErrorsStack } from '../libs/Errors.sol';

contract StackValue {
    enum StackType {
        // NONE in an OpSpec shows that the op pops or yields nothing
        NONE,
        // UINT256 in an OpSpec shows that the op pops or yields a uint256
        UINT256,
        STRING,
        ADDRESS
    }

    StackType private _type;

    uint256 private _uint256;
    string private _string;
    address private _address;

    function getUint256() public view returns (uint256) {
        require(_type == StackType.UINT256, ErrorsStack.STK1);
        return _uint256;
    }

    function setUint256(uint256 value) public {
        _uint256 = value;
        _type = StackType.UINT256;
    }

    function getString() public view returns (string memory) {
        require(_type == StackType.STRING, ErrorsStack.STK2);
        return _string;
    }

    function setString(string memory value) public {
        _string = value;
        _type = StackType.STRING;
    }

    function getAddress() public view returns (address) {
        require(_type == StackType.ADDRESS, ErrorsStack.STK3);
        return _address;
    }

    function setAddress(address _addr) public {
        _address = _addr;
        _type = StackType.ADDRESS;
    }

    function getType() public view returns (StackType) {
        return _type;
    }
}