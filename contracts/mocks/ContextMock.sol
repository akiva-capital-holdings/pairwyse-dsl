// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "../Context.sol";

contract ContextMock is Context {
    function setProgram(bytes memory data) public override {
        program = data;
    }
}
