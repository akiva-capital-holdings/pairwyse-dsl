// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { StringUtils } from '../libs/StringUtils.sol';

contract StringUtilsMock {
    function char(string memory s, uint256 index) public pure returns (string memory) {
        return StringUtils.char(s, index);
    }

    function equal(string memory s1, string memory s2) public pure returns (bool) {
        return StringUtils.equal(s1, s2);
    }

    function length(string memory s) public pure returns (uint256) {
        return StringUtils.length(s);
    }

    function concat(string memory s1, string memory s2) public pure returns (string memory) {
        return StringUtils.concat(s1, s2);
    }

    // Convert an hexadecimal string (without "0x" prefix) to raw bytes
    function fromHex(string memory s) public pure returns (bytes memory) {
        return StringUtils.fromHex(s);
    }

    // string decimal number to uint256
    function toUint256(string memory s) public pure returns (uint256) {
        return StringUtils.toUint256(s);
    }

    // Convert an hexadecimal character to their value
    function fromHexChar(bytes1 c) public pure returns (uint8) {
        return StringUtils.fromHexChar(c);
    }

    // string decimal number with e symbol (1e18) to uint256 (in wei)
    function getWei(string memory _s) public pure returns (string memory) {
        return StringUtils.getWei(_s);
    }
}
