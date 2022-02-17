// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library StringUtils {
    function char(string memory s, uint256 index) public pure returns (string memory) {
        require(index < length(s), 'String: index out of range');
        bytes memory sBytes = new bytes(1);
        sBytes[0] = bytes(s)[index];
        return string(sBytes);
    }

    function equal(string memory s1, string memory s2) internal pure returns (bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }

    function length(string memory s) internal pure returns (uint256) {
        return bytes(s).length;
    }

    function concat(string memory s1, string memory s2) internal pure returns (string memory) {
        return string(abi.encodePacked(s1, s2));
    }

    // Convert an hexadecimal string (without "0x" prefix) to raw bytes
    function fromHex(string memory s) public pure returns (bytes memory) {
        bytes memory ss = bytes(s);
        require(ss.length % 2 == 0, 'String: hex lenght not even'); // length must be even
        bytes memory r = new bytes(ss.length / 2);
        for (uint256 i = 0; i < ss.length / 2; ++i) {
            r[i] = bytes1(fromHexChar(ss[2 * i]) * 16 + fromHexChar(ss[2 * i + 1]));
        }
        return r;
    }

    // string decimal number to uint256
    function toUint256(string memory s) public pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 value;
        uint256 tmp;
        for (uint256 i = 0; i < b.length; i++) {
            tmp = uint8(b[i]);
            require(tmp >= 0x30 && tmp <= 0x39, 'String: non-decimal character');
            value = value * 10 + (tmp - 0x30); // 0x30 ascii is '0'
        }
        return value;
    }

    // Convert an hexadecimal character to their value
    function fromHexChar(bytes1 c) public pure returns (uint8) {
        if (c >= bytes1('0') && c <= bytes1('9')) {
            return uint8(c) - uint8(bytes1('0'));
        }
        if (c >= bytes1('a') && c <= bytes1('f')) {
            return 10 + uint8(c) - uint8(bytes1('a'));
        }
        if (c >= bytes1('A') && c <= bytes1('F')) {
            return 10 + uint8(c) - uint8(bytes1('A'));
        }
        return 0;
    }
}