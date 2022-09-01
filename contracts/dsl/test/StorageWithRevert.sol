// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract StorageWithRevert {
    function setStorageBool(bytes32, uint256) public pure {
        revert('setStorageBool error');
    }

    function setStorageUint256(bytes32, uint256) public pure {
        revert('setStorageUint256 error');
    }
}
