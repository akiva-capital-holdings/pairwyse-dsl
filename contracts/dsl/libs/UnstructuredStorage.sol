// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

library UnstructuredStorage {
    function getStorageBool(bytes32 position) internal view returns (bool data) {
        assembly {
            data := sload(position)
        }
    }

    function getStorageAddress(bytes32 position) internal view returns (address data) {
        assembly {
            data := sload(position)
        }
    }

    function getStorageBytes32(bytes32 position) internal view returns (bytes32 data) {
        assembly {
            data := sload(position)
        }
    }

    function getStorageUint256(bytes32 position) internal view returns (uint256 data) {
        assembly {
            data := sload(position)
        }
    }

    function getArrayFromStorage(bytes32 position) internal view returns (bytes memory) {
        bytes32 nextPosition;
        bytes32 data;
        assembly {
            data := sload(position)
            nextPosition := sload(add(position, 0x20)) // 0x20 is the size of data
        }
        return bytes.concat(data, nextPosition);
    }

    function setStorageBool(bytes32 position, bool data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageAddress(bytes32 position, address data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageBytes32(bytes32 position, bytes32 data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageUint256(bytes32 position, uint256 data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setArrayToStorage(
        bytes32 position,
        bytes32 data,
        bytes32 nextPosition
    ) internal {
        assembly {
            sstore(position, data)
            sstore(add(position, 0x20), nextPosition) // 0x20 is the size of data
        }
    }
}
