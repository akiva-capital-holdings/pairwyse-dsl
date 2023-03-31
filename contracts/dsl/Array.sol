/**
 * (c) 2023 Pairwyse Foundation.  All Rights Reserved.
 * 
 * For LICENSE details, please visit:
 * https://github.com/akiva-capital-holdings/pairwyse-dsl/blob/master/LICENSE
 *
 */
 
pragma solidity ^0.8.0;

contract Array {
    enum ValueTypes {
        ADDRESS,
        UINT256,
        BYTES32,
        BOOL
    }

    function setStorage(
        string memory arrName,
        bool isArray,
        uint8 elemsType,
        bytes4 nextPtr
    ) external {
        bytes32 position = bytes4(keccak256(abi.encodePacked(arrName)));

        assembly {
            sstore(position, isArray)
            sstore(add(position, 1), elemsType)
            sstore(add(position, 2), nextPtr)
        }
    }

    function getStorage(
        string memory arrName
    ) external view returns (bool isArray, uint8 elemsType, bytes4 nextPrt) {
        bytes32 position = bytes4(keccak256(abi.encodePacked(arrName)));

        assembly {
            isArray := sload(position)
            elemsType := sload(add(position, 1))
            nextPrt := sload(add(position, 2))
        }
    }
}
