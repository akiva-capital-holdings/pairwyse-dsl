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
        // TODO: check collisions in the hash value
        // https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#non-standard-packed-mode
        return string(abi.encodePacked(s1, s2));
    }

    // Convert an hexadecimal string (without "0x" prefix) to raw bytes
    // TODO: check if the string is empty
    function fromHex(string memory s) public pure returns (bytes memory) {
        bytes memory ss = bytes(s);
        require(ss.length % 2 == 0, 'String: hex lenght not even'); // length must be even
        bytes memory r = new bytes(ss.length / 2);
        for (uint256 i = 0; i < ss.length / 2; ++i) {
            r[i] = bytes1(fromHexChar(ss[2 * i]) * 16 + fromHexChar(ss[2 * i + 1]));
        }
        return r;
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return '0';
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // string decimal number to uint256
    function toUint256(string memory s) public pure returns (uint256 value) {
        bytes memory b = bytes(s);
        uint256 tmp;
        for (uint256 i = 0; i < b.length; i++) {
            tmp = uint8(b[i]);
            require(tmp >= 0x30 && tmp <= 0x39, 'String: non-decimal character');
            value = value * 10 + (tmp - 0x30); // 0x30 ascii is '0'
        }
    }

    // Convert an hexadecimal character to their value
    function fromHexChar(bytes1 c) public pure returns (uint8 result) {
        if (c >= bytes1('0') && c <= bytes1('9')) {
            result = uint8(c) - uint8(bytes1('0'));
        }
        if (c >= bytes1('a') && c <= bytes1('f')) {
            result = 10 + uint8(c) - uint8(bytes1('a'));
        }
        if (c >= bytes1('A') && c <= bytes1('F')) {
            result = 10 + uint8(c) - uint8(bytes1('A'));
        }
        // TODO: check that returns 0
    }
}
