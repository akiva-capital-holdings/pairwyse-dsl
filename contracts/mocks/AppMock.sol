//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Parser.sol";
import "hardhat/console.sol";

contract AppMock is Parser {
    using UnstructuredStorage for bytes32;

    bytes4 public constant MIN_BLOCK = bytes4(keccak256("MIN_BLOCK"));
    // bytes4 public constant NUMBER2 = bytes4(keccak256("NUMBER2"));

    // bytes4 public constant BYTES = bytes4(keccak256("BYTES"));
    // bytes4 public constant BYTES2 = bytes4(keccak256("BYTES2"));

    // bytes4 public constant ADDR = bytes4(keccak256("ADDR"));
    // bytes4 public constant ADDR2 = bytes4(keccak256("ADDR2"));

    // bytes4 public constant BOOL = bytes4(keccak256("BOOL"));
    // bytes4 public constant BOOL2 = bytes4(keccak256("BOOL2"));

    // function setMinBlock(uint256 minBlock) public {
    //     bytes32(MIN_BLOCK).setStorageUint256(minBlock);
    // }
}
