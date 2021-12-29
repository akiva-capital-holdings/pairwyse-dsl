//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../helpers/Storage.sol";
import "../Eval.sol";
import "./ContextMock.sol";
import "hardhat/console.sol";

contract EvalAppMock is Eval, Storage {
    using UnstructuredStorage for bytes32;

    constructor(ContextMock _ctx, Opcodes _opcodes) Eval(_ctx, _opcodes) {
        ctx = _ctx;
        opcodes = _opcodes;
    }
}
