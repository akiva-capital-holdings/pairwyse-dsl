//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ParserMock.sol";
import "hardhat/console.sol";

contract AppParserMock is ParserMock {
    using UnstructuredStorage for bytes32;
}
