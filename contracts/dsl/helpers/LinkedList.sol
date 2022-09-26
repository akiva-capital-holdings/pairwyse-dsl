// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import 'hardhat/console.sol';

contract LinkedList {
    mapping(bytes32 => bytes32) public heads; // arr name > head to array (first elem)
    mapping(bytes32 => bytes32) public types; // arr name > type to array

    function getNextPosition(bytes32 position) public view returns (bytes32 nextPosition) {
        assembly {
            nextPosition := sload(add(position, 0x20))
        }
    }

    function getLenght(bytes32 position) public view returns (uint256 count) {
        if (heads[position] == 0x0) return 0;

        bytes32 nextPosition = heads[position];
        while (nextPosition != bytes32(0x0)) {
            nextPosition = getNextPosition(nextPosition);
            count++;
        }
    }

    function getItemByIndex(uint256 index, bytes32 arrName) public view returns (bytes32 data) {
        uint256 count;
        bytes32 currentPosition = heads[arrName]; // head

        while (count < index) {
            count++;
            currentPosition = getNextPosition(currentPosition);
        }
        (data, ) = getData(currentPosition);
    }

    function getData(bytes32 position) internal view returns (bytes32, bytes32) {
        bytes32 data;
        bytes32 nextPosition;
        assembly {
            data := sload(position)
            nextPosition := sload(add(position, 0x20)) // 0x20 is the size from data
        }

        return (data, nextPosition);
    }

    function declare(bytes32 _type, bytes32 arrName) public {
        types[arrName] = _type;
    }

    function addItem(bytes32 item, bytes32 arrName) public {
        bytes32 previousPosition;
        bytes32 head = heads[arrName];

        // if array is empty and was not declare
        if (head == bytes32(0x0) && types[arrName] != bytes32(0x0)) {
            // Creates first position in array for the first item
            head = _getEmptyMemoryPosition();
            console.log('head');
            console.logBytes32(head);
            heads[arrName] = head;
            insertItem(head, item);
        } else {
            // add the new data to existing position in the array
            bytes32 currentPosition = head;

            while (currentPosition != bytes32(0x0)) {
                previousPosition = currentPosition;
                (, currentPosition) = getData(currentPosition);
            }
            bytes32 nextPosition = _getEmptyMemoryPosition();
            console.log('previousPosition');
            console.logBytes32(previousPosition);
            console.log('nextPosition');
            console.logBytes32(nextPosition);
            updateLinkToNextItem(previousPosition, nextPosition);
            insertItem(nextPosition, item);
        }
    }

    function _getEmptyMemoryPosition() internal returns (bytes32 position) {
        assembly {
            // allocate output byte array - this could also be done without assembly
            // by using position = new bytes(size)
            position := mload(0x40) // free memory pointer + our salt? or without salt
            // position := msize() // Get the highest available block of memory
            // new "memory end" including padding
            // 32 for item + 32 for position = 64 = 0x3E
            mstore(0x40, add(position, and(add(add(0x40, 0x20), 0x1f), not(0x1f))))
            // mstore(0x40, add(position, 0x40))
        }
    }

    function insertItem(bytes32 position, bytes32 _item) public {
        assembly {
            sstore(position, _item)
            sstore(add(position, 0x20), 0x0) // no need?
            // mstore(0x40, add(position, 0x40))
        }
    }

    function updateLinkToNextItem(bytes32 position, bytes32 nextPosition) public {
        assembly {
            sstore(add(position, 0x20), nextPosition)
        }
    }
}
