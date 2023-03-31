/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

contract StorageWithRevert {
    function setStorageBool(bytes32, uint256) public pure {
        revert('setStorageBool error');
    }

    function setStorageUint256(bytes32, uint256) public pure {
        revert('setStorageUint256 error');
    }
}
