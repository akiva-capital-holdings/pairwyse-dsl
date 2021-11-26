//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../lib/UnstructuredStorage.sol";

contract Storage {
    using UnstructuredStorage for bytes32;

    bytes4 public constant NUMBER = bytes4(keccak256("NUMBER"));
    bytes4 public constant NUMBER2 = bytes4(keccak256("NUMBER2"));

    // function setStorageBool(bytes32 position, bool data) internal {
    //     position.setStorageBool(data);
    // }

    // function setStorageAddress(bytes32 position, address data) internal {
    //     position.setStorageAddress(data);
    // }

    // function setStorageBytes32(bytes32 position, bytes32 data) internal {
    //     position.setStorageBytes32(data);
    // }

    // function setStorageUint256(bytes32 position, uint256 data) internal {
    //     position.setStorageUint256(data);
    // }


    function getStorageUint256(bytes32 position) public view returns (uint256 data) {
        // console.log("getStorageUint256");
        // console.logBytes32(position);
        assembly { data := sload(position) }
    }

    function setStorageUint256(bytes32 position, uint256 data) public {
        // console.log("setStorageUint256");
        // console.logBytes32(position);
        assembly { sstore(position, data) }
    }
}
