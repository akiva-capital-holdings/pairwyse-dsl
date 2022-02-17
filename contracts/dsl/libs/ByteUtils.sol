// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library ByteUtils {
    function slice(
        bytes calldata _data,
        uint256 _start,
        uint256 _end
    ) public pure returns (bytes memory) {
        return _data[_start:_end];
    }
}
