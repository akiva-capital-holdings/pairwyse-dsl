// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IStorageUniversal {
    function setStorageBool(bytes32 position, bytes32 data) external;

    function setStorageAddress(bytes32 position, bytes32 data) external;

    function setStorageUint256(bytes32 position, bytes32 data) external;
}
