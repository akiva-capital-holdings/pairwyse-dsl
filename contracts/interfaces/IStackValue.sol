//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IStackValue {
    enum StackType {
        // NONE in an OpSpec shows that the op pops or yields nothing
        NONE,
        // UINT256 in an OpSpec shows that the op pops or yields a uint256
        UINT256
    }

    function getUint256() external view returns (uint256);
    function setUint256(uint256 value) external;
    function getType() external view returns (StackType);
}