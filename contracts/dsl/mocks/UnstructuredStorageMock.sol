/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

import { IStorage } from '../interfaces/IStorage.sol';
import { IStorageUniversal } from '../interfaces/IStorageUniversal.sol';
import { UnstructuredStorage } from '../../dsl/libs/UnstructuredStorage.sol';

contract UnstructuredStorageMock is IStorage, IStorageUniversal {
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

    function setStorageBool(bytes32 position, bool data) public {
        position.setStorageBool(data);
    }

    function setStorageBool(bytes32 position, bytes32 data) public {
        position.setStorageBool(data);
    }

    function setStorageAddress(bytes32 position, address data) public {
        position.setStorageAddress(data);
    }

    function setStorageAddress(bytes32 position, bytes32 data) public {
        position.setStorageAddress(data);
    }

    function setStorageBytes32(bytes32 position, bytes32 data) public {
        position.setStorageBytes32(data);
    }

    function setStorageUint256(bytes32 position, uint256 data) public {
        position.setStorageUint256(data);
    }

    function setStorageUint256(bytes32 position, bytes32 data) public {
        position.setStorageUint256(data);
    }
}
