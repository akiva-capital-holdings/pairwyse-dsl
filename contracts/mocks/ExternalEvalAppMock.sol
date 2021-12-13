//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Storage.sol";
import "../Eval.sol";
import "./ContextMock.sol";
import "hardhat/console.sol";

contract ExternalEvalAppMock is Eval, Storage {
    using UnstructuredStorage for bytes32;

    // bytes4 public constant NUMBER = bytes4(keccak256("NUMBER"));
    // bytes4 public constant NUMBER2 = bytes4(keccak256("NUMBER2"));

    // bytes4 public constant BYTES = bytes4(keccak256("BYTES"));
    // bytes4 public constant BYTES2 = bytes4(keccak256("BYTES2"));

    // bytes4 public constant ADDR = bytes4(keccak256("ADDR"));
    // bytes4 public constant ADDR2 = bytes4(keccak256("ADDR2"));

    // bytes4 public constant BOOL = bytes4(keccak256("BOOL"));
    // bytes4 public constant BOOL2 = bytes4(keccak256("BOOL2"));

    constructor(ContextMock _ctx, Opcodes _opcodes) Eval(_ctx, _opcodes) {
        ctx = _ctx;
        opcodes = _opcodes;
    }
}
