/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { ErrorsStringUtils } from './Errors.sol';
import { ByteUtils } from './ByteUtils.sol';

/**
 * @dev Library that simplifies working with strings in Solidity
 */
library StringUtils {
    /**
     * @dev Get character in string by index
     * @param _s Input string
     * @param _index Target index in the string
     * @return Character by index
     */
    function char(string memory _s, uint256 _index) public pure returns (string memory) {
        require(_index < length(_s), ErrorsStringUtils.SUT1);
        bytes memory _sBytes = new bytes(1);
        _sBytes[0] = bytes(_s)[_index];
        return string(_sBytes);
    }

    /**
     * @dev Compares two strings
     * @param _s1 One string
     * @param _s2 Another string
     * @return Are string equal
     */
    function equal(string memory _s1, string memory _s2) internal pure returns (bool) {
        return keccak256(abi.encodePacked(_s1)) == keccak256(abi.encodePacked(_s2));
    }

    /**
     * @dev Gets length of the string
     * @param _s Input string
     * @return The lenght of the string
     */
    function length(string memory _s) internal pure returns (uint256) {
        return bytes(_s).length;
    }

    /**
     * @dev Concats two strings
     * @param _s1 One string
     * @param _s2 Another string
     * @return The concatenation of the strings
     */
    function concat(string memory _s1, string memory _s2) internal pure returns (string memory) {
        return string(abi.encodePacked(_s1, _s2));
    }

    /**
     * @dev Creates a substring from a string
     * Ex. substr('0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE', 2, 42) => '9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE'
     * @param _str Input string
     * @param _start Start index (inclusive)
     * @param _end End index (not inclusive)
     * @return Substring
     */
    function substr(
        string memory _str,
        uint256 _start,
        uint256 _end
    ) public pure returns (string memory) {
        bytes memory strBytes = bytes(_str);
        bytes memory result = new bytes(_end - _start);
        for (uint256 i = _start; i < _end; i++) {
            result[i - _start] = strBytes[i];
        }
        return string(result);
    }

    /**
     * @dev Checks is _char is present in the _string
     * Ex. `_`.in('123_456') => true
     * Ex. `8`.in('123456') => false
     * @param _char Searched character
     * @param _string String to search in
     * @return Is the character presented in the string
     */
    function isIn(string memory _char, string memory _string) public pure returns (bool) {
        for (uint256 i = 0; i < length(_string); i++) {
            if (equal(char(_string, i), _char)) return true;
        }
        return false;
    }

    // Convert an hexadecimal string (without "0x" prefix) to raw bytes
    function fromHex(string memory s) public pure returns (bytes memory) {
        return ByteUtils.fromHexBytes(bytes(s));
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation
     * @notice Inspired by OraclizeAPI's implementation - MIT licence
     * https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
     * @param _num Input number
     * @return Number represented as a string
     */
    function toString(uint256 _num) internal pure returns (string memory) {
        if (_num == 0) {
            return '0';
        }
        uint256 _temp = _num;
        uint256 _digits;
        while (_temp != 0) {
            _digits++;
            _temp /= 10;
        }
        bytes memory _buffer = new bytes(_digits);
        while (_num != 0) {
            _digits -= 1;
            _buffer[_digits] = bytes1(uint8(48 + uint256(_num % 10)));
            _num /= 10;
        }
        return string(_buffer);
    }

    /**
     * @dev Converts a decimal number (provided as a string) to uint256
     * @param _s Input decimal number (provided as a string)
     * @return value Unsigned integer from input string
     */
    function toUint256(string memory _s) public pure returns (uint256 value) {
        bytes memory b = bytes(_s);
        uint256 tmp;
        for (uint256 i = 0; i < b.length; i++) {
            tmp = uint8(b[i]);
            require(tmp >= 0x30 && tmp <= 0x39, ErrorsStringUtils.SUT3);
            value = value * 10 + (tmp - 0x30); // 0x30 ascii is '0'
        }
    }

    /**
     * @dev Converts a decimal number (provided as a string) with e symbol (1e18) to number (returned as a string)
     * @param _s Input decimal number (provided as a string)
     * @return result Unsigned integer in a string format
     */
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
        result = toString(toUint256(base) * (10 ** toUint256(decimals)));
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
