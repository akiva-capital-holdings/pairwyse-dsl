// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IStorage {
    function getStorageBool(bytes32 position) external view returns (bool data);

    function getStorageAddress(bytes32 position) external view returns (address data);

    function getStorageBytes32(bytes32 position) external view returns (bytes32 data);

    function getStorageUint256(bytes32 position) external view returns (uint256 data);
}
