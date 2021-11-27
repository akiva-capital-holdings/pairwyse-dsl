//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../Eval.sol";
import "../Storage.sol";
import "./ContextMock.sol";
import "hardhat/console.sol";

contract ApplicationMock is Eval, Storage {
    using UnstructuredStorage for bytes32;

    // bytes4 public constant NUMBER = bytes4(keccak256("NUMBER"));
    // bytes4 public constant NUMBER2 = bytes4(keccak256("NUMBER2"));

    // bytes4 public constant BYTES = bytes4(keccak256("BYTES"));
    // bytes4 public constant BYTES2 = bytes4(keccak256("BYTES2"));

    // bytes4 public constant ADDR = bytes4(keccak256("ADDR"));
    // bytes4 public constant ADDR2 = bytes4(keccak256("ADDR2"));

    // bytes4 public constant BOOL = bytes4(keccak256("BOOL"));
    // bytes4 public constant BOOL2 = bytes4(keccak256("BOOL2"));

    constructor() {
        ctx = new ContextMock();
        opcodes = new Opcodes(ctx);
    }

    function setStorageBool(bytes32 position, bool data) public {
        position.setStorageBool(data);
    }

    function setStorageAddress(bytes32 position, address data) public {
        position.setStorageAddress(data);
    }

    function setStorageBytes32(bytes32 position, bytes32 data) public {
        position.setStorageBytes32(data);
    }

    function setStorageUint256(bytes32 position, uint256 data) public {
        position.setStorageUint256(data);
    }
}
