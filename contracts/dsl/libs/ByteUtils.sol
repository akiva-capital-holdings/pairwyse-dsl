// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

// import "hardhat/console.sol";

library ByteUtils {
    function slice(
        bytes calldata _data,
        uint256 _start,
        uint256 _end
    ) public pure returns (bytes memory) {
        require(_start < _end, "ByteUtils: 'end' index must be greater than 'start'");
        require(_end <= _data.length, "ByteUtils: 'end' is greater than the length of the array");
        return _data[_start:_end];
    }
}
