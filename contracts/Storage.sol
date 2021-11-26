//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./lib/UnstructuredStorage.sol";
import "./IStorage.sol";

contract Storage is IStorage {
    using UnstructuredStorage for bytes32;

    function getStorageBool(bytes32 position) public view override returns (bool data) {
        return position.getStorageBool();
    }

    function getStorageAddress(bytes32 position) public view override returns (address data) {
        return position.getStorageAddress();
    }

    function getStorageBytes32(bytes32 position) public view override returns (bytes32 data) {
        return position.getStorageBytes32();
    }

    function getStorageUint256(bytes32 position) public view override returns (uint256 data) {
        return position.getStorageUint256();
    }
}
