// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ErrorsStringUtils } from './Errors.sol';

// import 'hardhat/console.sol';

library StringUtils {
    function char(string memory s, uint256 index) public pure returns (string memory) {
        require(index < length(s), ErrorsStringUtils.SUT1);
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

    /**
     * @dev Checks is _char is present in the _string
     * Ex. `_`.in('123_456') => true
     * Ex. `8`.in('123456') => false
     */
    function isIn(string memory _char, string memory _string) public pure returns (bool) {
        for (uint256 i = 0; i < length(_string); i++) {
            if (equal(char(_string, i), _char)) return true;
        }
        return false;
    }

    // Convert an hexadecimal string (without "0x" prefix) to raw bytes
    function fromHex(string memory s) public pure returns (bytes memory) {
        return fromHexBytes(bytes(s));
    }

    // Convert an hexadecimal string in bytes (without "0x" prefix) to raw bytes
    // TODO: move this to BytesUtils lib
    function fromHexBytes(bytes memory ss) public pure returns (bytes memory) {
        require(ss.length % 2 == 0, ErrorsStringUtils.SUT2); // length must be even
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
            require(tmp >= 0x30 && tmp <= 0x39, ErrorsStringUtils.SUT3);
            value = value * 10 + (tmp - 0x30); // 0x30 ascii is '0'
        }
    }

    // string decimal number with e symbol (1e18) to uint256 (in wei)
    function parseScientificNotation(string memory _s) public pure returns (string memory result) {
        bool isFound; // was `e` symbol found
        uint256 tmp;
        bytes memory b = bytes(_s);
        string memory base;
        string memory decimals;

        for (uint256 i = 0; i < b.length; i++) {
            tmp = uint8(b[i]);

            if (tmp >= 0x30 && tmp <= 0x39) {
                if (!isFound) {
                    base = concat(base, string(abi.encodePacked(b[i])));
                } else {
                    decimals = concat(decimals, string(abi.encodePacked(b[i])));
                }
            } else if (tmp == 0x65 && !isFound) {
                isFound = true;
            } else {
                // use only one `e` sympol between values without spaces; example: 1e18 or 456e10
                revert(ErrorsStringUtils.SUT5);
            }
        }

        require(!equal(base, ''), ErrorsStringUtils.SUT9);
        require(!equal(decimals, ''), ErrorsStringUtils.SUT6);
        result = toString(toUint256(base) * (10**toUint256(decimals)));
    }

    /**
     * @dev If the string starts with a number, so we assume that it's a number.
     * @param _string is a current string for checking
     * @return isNumber that is true if the string starts with a number, otherwise is false
     */
    function mayBeNumber(string memory _string) public pure returns (bool) {
        require(!equal(_string, ''), ErrorsStringUtils.SUT7);
        bytes1 _byte = bytes(_string)[0];
        return uint8(_byte) >= 48 && uint8(_byte) <= 57;
    }

    /**
     * @dev If the string starts with `0x` symbols, so we assume that it's an address.
     * @param _string is a current string for checking
     * @return isAddress that is true if the string starts with `0x` symbols, otherwise is false
     */
    function mayBeAddress(string memory _string) public pure returns (bool) {
        require(!equal(_string, ''), ErrorsStringUtils.SUT7);
        if (bytes(_string).length != 42) return false;

        bytes1 _byte = bytes(_string)[0];
        bytes1 _byte2 = bytes(_string)[1];
        return uint8(_byte) == 48 && uint8(_byte2) == 120;
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
        revert(ErrorsStringUtils.SUT8);
    }

    /**
     * @dev Checks is string is a valid DSL variable name (matches regexp /^([A-Z_$][A-Z\d_$]*)$/g)
     * @param _s is a current string to check
     * @return isCapital whether the string is a valid DSL variable name or not
     */
    function isValidVarName(string memory _s) public pure returns (bool) {
        require(!equal(_s, ''), ErrorsStringUtils.SUT7);

        uint8 A = 0x41;
        uint8 Z = 0x5a;
        uint8 underscore = 0x5f;
        uint8 dollar = 0x24;
        uint8 zero = 0x30;
        uint8 nine = 0x39;

        uint8 symbol;
        // This is the same as applying regexp /^([A-Z_$][A-Z\d_$]*)$/g
        for (uint256 i = 0; i < length(_s); i++) {
            symbol = uint8(bytes(_s)[i]);
            if (
                (i == 0 &&
                    !((symbol >= A && symbol <= Z) || symbol == underscore || symbol == dollar)) ||
                (i > 0 &&
                    !((symbol >= A && symbol <= Z) ||
                        (symbol >= zero && symbol <= nine) ||
                        symbol == underscore ||
                        symbol == dollar))
            ) {
                return false;
            }
        }
        return true;
    }
}
