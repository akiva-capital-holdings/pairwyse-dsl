//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Parser.sol";
import "hardhat/console.sol";

contract AppMock is Parser {
    using UnstructuredStorage for bytes32;

    bytes4 public constant MIN_BLOCK = bytes4(keccak256("MIN_BLOCK"));

    /* solhint-disable no-empty-blocks */
    receive() external payable {}
    /* solhint-enable no-empty-blocks */
}
