// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import { Parser } from "../Parser.sol";
import { UnstructuredStorage } from "../libs/UnstructuredStorage.sol";
import "hardhat/console.sol";

contract AppMock is Parser {
    using UnstructuredStorage for bytes32;

    bytes4 public constant MIN_BLOCK = bytes4(keccak256("MIN_BLOCK"));
}
