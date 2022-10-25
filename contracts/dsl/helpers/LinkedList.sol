// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { ILinkedList } from '../interfaces/ILinkedList.sol';

// import 'hardhat/console.sol';

// TODO: make a library
contract LinkedList is ILinkedList {
    /* Important!
    As the contract is working directly with storage pointers, so
    there is must not be any additional variables exept mappings.
    In this case the contract uses `type(uint256).max` as parameter that means the
    end of the array.

    TODO: before using next pointer from _getEmptyMemoryPosition for inserting
    `item` to array it needs to check conflicts with mappings hashes
    example of getting output mapping value:
    num, slot are some uin256 values in mapping

        assembly {
            // Store num in memory scratch space
            mstore(0, num)
            // Store slot number in scratch space after num
            mstore(32, slot)
            // Create hash from previously stored num and slot
            let hash := keccak256(0, 64)
            // Load mapping value using the just calculated hash
            result := sload(hash)
        }
    */

    // TODO: move all variables to Context
    bytes32 public constant EMPTY = bytes32(type(uint256).max);

    // arr name => head to array (positions to the first element in arrays)
    mapping(bytes32 => bytes32) private heads;
    mapping(bytes32 => bytes1) private types; // arr name => type to array
    mapping(bytes32 => uint256) private lengths; // arr name => length of array

    /**
     * @dev Returns length of the array
     * @param _arrName is a bytecode of the array name
     */
    function getType(bytes32 _arrName) external view returns (bytes1) {
        return types[_arrName];
    }

    /**
     * @dev Returns length of the array
     * @param _arrName is a bytecode of the array name
     */
    function getLength(bytes32 _arrName) external view returns (uint256) {
        return lengths[_arrName];
    }

    /**
     * @dev Returns the item data from the array by its index
     * @param _index is an index of the item in the array that starts from 0
     * @param _arrName is a bytecode of the array name
     * @return data is a bytecode of the item from the array or empty bytes if no item exists by this index
     */
    function get(uint256 _index, bytes32 _arrName) public view returns (bytes32 data) {
        uint256 count;
        bytes32 currentPosition = heads[_arrName];

        while (count++ < _index) {
            (, currentPosition) = _getData(currentPosition);
        }
        (data, ) = _getData(currentPosition);
    }

    /**
     * @dev Declares the new array in dependence of its type
     * @param _type is a bytecode type of the array. Bytecode of each type can be find in Context contract
     * @param _arrName is a bytecode of the array name
     */
    function declare(bytes1 _type, bytes32 _arrName) external {
        types[_arrName] = _type;
        heads[_arrName] = EMPTY;
    }

    /**
     * @dev Pushed item to the end of the array. Increases the length of the array
     * @param _item is a bytecode type of the array. Bytecode of each type can be find in Context contract
     * @param _arrName is a bytecode of the array name
     */
    function addItem(bytes32 _item, bytes32 _arrName) external {
        bytes32 previousPosition;
        bytes32 nodePtr = _getEmptyMemoryPosition();

        if (heads[_arrName] == EMPTY) {
            // creates the first position in array for the first item
            heads[_arrName] = nodePtr;
            _insertItem(nodePtr, _item);
        } else {
            // add the new data to existing _position in the array
            bytes32 currentPosition = getHead(_arrName);

            while (currentPosition != EMPTY) {
                previousPosition = currentPosition;
                (, currentPosition) = _getData(currentPosition);
            }

            _insertItem(nodePtr, _item);
            // In previous stored item in the array it creates new position(link) to the new item
            _updateLinkToNextItem(previousPosition, nodePtr);
        }
        lengths[_arrName]++;
    }

    /**
     * @dev Returns the head position of the array:
     * - `bytes32(0x0)` value if array has not declared yet,
     * - `bytes32(type(uint256).max` if array was just declared but it is empty
     * - `other bytecode` with a position of the first element of the array
     * @param _arrName is a bytecode of the array name
     */
    function getHead(bytes32 _arrName) public view returns (bytes32) {
        return heads[_arrName];
    }

    /**
     * @dev Insert item in the array by provided position. Updates new storage pointer
     * for the future inserting
     */
    function _insertItem(bytes32 _position, bytes32 _item) internal {
        /*
            TODO:
            - fix empty space between items as additional 0x20
            - check why padding is used in doc for mstore
        */
        uint256 maxUint256 = type(uint256).max;

        assembly {
            sstore(_position, _item) // save _item
            sstore(add(_position, 0x20), maxUint256) // nextPosition
            sstore(0x40, add(_position, 0x60)) // new "storage end"
            // 0x40 = free storage pointer + ((62 + 32) + 31) + 4294967264)
            // sstore(0x40, add(_position, and(add(add(0x40, 0x20), 0x1f), not(0x1f))))
        }
    }

    /**
     * @dev Updates the next position for the provided(current) position
     */
    function _updateLinkToNextItem(bytes32 _position, bytes32 _nextPosition) internal {
        assembly {
            sstore(add(_position, 0x20), _nextPosition)
        }
    }

    /**
     * @dev Uses 0x40 position as free storage pointer that returns value of current free position.
     * In this contract it 0x40 position value updates by _insertItem function anfter
     * adding new item in the array. See: mload - free memory pointer in the doc
     * @return position is a value that stores in the 0x40 position in the storage
     */
    function _getEmptyMemoryPosition() internal view returns (bytes32 position) {
        assembly {
            position := sload(0x40) // free storage pointer, mload - free memory pointer
            // TODO: make it dynamically as  _position := msize() but in the storage.
            // kinda get the highest available block of memory
        }
    }

    /**
     * @dev Returns the value of current position and the position(nextPosition)
     * to the next object in array
     * @param _position is a current item position in the array
     * @return data is a current data stored in the _position
     * @return nextPosition is a next position to the next item in the array
     */
    function _getData(bytes32 _position)
        internal
        view
        returns (bytes32 data, bytes32 nextPosition)
    {
        assembly {
            data := sload(_position)
            nextPosition := sload(add(_position, 0x20)) // 0x20 is the size from data
        }
        return (data, nextPosition);
    }
}
