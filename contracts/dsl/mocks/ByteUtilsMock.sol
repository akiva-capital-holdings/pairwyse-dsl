// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { ByteUtils } from '../libs/ByteUtils.sol';

contract ByteUtilsMock {
    function slice(
        bytes calldata _data,
        uint256 _start,
        uint256 _end
    ) public pure returns (bytes memory) {
        return ByteUtils.slice(_data, _start, _end);
    }

    // Convert an hexadecimal character to their value
    function fromHexChar(bytes1 _c) public pure returns (uint8) {
        return ByteUtils.fromHexChar(_c);
    }
}
