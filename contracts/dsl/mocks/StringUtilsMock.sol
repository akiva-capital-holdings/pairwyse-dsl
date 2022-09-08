// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { StringUtils } from '../libs/StringUtils.sol';

contract StringUtilsMock {
    function char(string memory _s, uint256 _index) public pure returns (string memory) {
        return StringUtils.char(_s, _index);
    }

    function equal(string memory _s1, string memory _s2) public pure returns (bool) {
        return StringUtils.equal(_s1, _s2);
    }

    function length(string memory _s) public pure returns (uint256) {
        return StringUtils.length(_s);
    }

    function concat(string memory _s1, string memory _s2) public pure returns (string memory) {
        return StringUtils.concat(_s1, _s2);
    }

    // Convert an hexadecimal string (without "0x" prefix) to raw bytes
    function fromHex(string memory _s) public pure returns (bytes memory) {
        return StringUtils.fromHex(_s);
    }

    // string decimal number to uint256
    function toUint256(string memory _s) public pure returns (uint256) {
        return StringUtils.toUint256(_s);
    }

    // uint256 to string
    function fromUint256toString(uint256 _s) public pure returns (string memory) {
        return StringUtils.toString(_s);
    }

    // Convert an hexadecimal character to their value
    function fromHexChar(bytes1 _c) public pure returns (uint8) {
        return StringUtils.fromHexChar(_c);
    }

    function convertation(string memory _s, uint256 _m) public pure returns (string memory) {
        return StringUtils.convertation(_s, _m);
    }

    // string decimal number with e symbol (1e18) to uint256 (in wei)
    function getWei(string memory _s) public pure returns (string memory) {
        return StringUtils.getWei(_s);
    }

    // string decimal number with e symbol (1e18) to uint256 (in wei)
    function mayBeNumber(string memory _s) public pure returns (bool isNumber) {
        return StringUtils.mayBeNumber(_s);
    }
}
