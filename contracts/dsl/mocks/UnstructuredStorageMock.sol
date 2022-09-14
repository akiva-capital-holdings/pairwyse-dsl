// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { UnstructuredStorage } from '../../dsl/libs/UnstructuredStorage.sol';

contract UnstructuredStorageMock {
    using UnstructuredStorage for bytes32;

    function getStorageBool(bytes32 position) public view returns (bool data) {
        return position.getStorageBool();
    }

    function getStorageAddress(bytes32 position) public view returns (address data) {
        return position.getStorageAddress();
    }

    function getStorageBytes32(bytes32 position) public view returns (bytes32 data) {
        return position.getStorageBytes32();
    }

    function getStorageUint256(bytes32 position) public view returns (uint256 data) {
        return position.getStorageUint256();
    }

    function getStorageWithType(bytes32 position) public view returns (bytes memory) {
        return position.getStorageWithType();
    }

    function setStorageWithType(
        bytes32 position,
        uint256 dataType,
        bytes32 data
    ) public {
        return position.setStorageWithType(dataType, data);
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
