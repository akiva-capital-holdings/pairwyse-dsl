// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library StringUtils {
    function char(string memory s, uint256 index) public pure returns (string memory) {
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
        require(ss.length % 2 == 0, "hex not even"); // length must be even
        bytes memory r = new bytes(ss.length / 2);
        for (uint256 i = 0; i < ss.length / 2; ++i) {
            r[i] = bytes1(fromHexChar(uint8(ss[2 * i])) * 16 + fromHexChar(uint8(ss[2 * i + 1])));
        }
        return r;
    }

    // string decimal number to uint256
    function toUint256(string memory s) public pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 value = 0;
        for (uint256 i = 0; i < b.length; i++) {
            value = value * 10 + (uint8(b[i]) - 0x30); // 0x30 ascii is '0'
        }
        return value;
    }

    // Convert an hexadecimal character to their value
    function fromHexChar(uint8 c) private pure returns (uint8) {
        if (bytes1(c) >= bytes1("0") && bytes1(c) <= bytes1("9")) {
            return c - uint8(bytes1("0"));
        }
        if (bytes1(c) >= bytes1("a") && bytes1(c) <= bytes1("f")) {
            return 10 + c - uint8(bytes1("a"));
        }
        if (bytes1(c) >= bytes1("A") && bytes1(c) <= bytes1("F")) {
            return 10 + c - uint8(bytes1("A"));
        }
        return 0;
    }
}
