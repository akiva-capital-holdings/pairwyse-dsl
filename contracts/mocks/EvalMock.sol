//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Eval.sol";
import "./ContextMock.sol";

contract EvalMock is Eval {
    constructor() {
        ctx = new ContextMock();
        opcodes = new Opcodes(ctx);
    }
}