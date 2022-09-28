// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import 'hardhat/console.sol';

// FREE_POINTER describe better
contract LinkedList {
    mapping(bytes32 => bytes32) public heads; // arr name > head to array (first elem)
    mapping(bytes32 => bytes32) public types; // arr name > type to array
    bytes32 private FREE_POINTER =
        bytes32(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);

    function getNextPosition(bytes32 position) public view returns (bytes32 nextPosition) {
        assembly {
            nextPosition := sload(add(position, 0x20))
        }
    }

    function getLength(bytes32 arrName) public view returns (uint256 count) {
        bytes32 currentPosition = heads[arrName];
        // if(currentPosition == bytes32(0x0)) return 0;
        while (currentPosition != FREE_POINTER) {
            (, currentPosition) = getData(currentPosition);
            count++;
        }
    }

    function getItemByIndex(uint256 index, bytes32 arrName) public view returns (bytes32 data) {
        uint256 count;
        bytes32 currentPosition = heads[arrName]; // head
        bytes32 np;

        // currentPosition can not be zero, so here we skip it because of two reasons
        // 1. as FREE_POINTER was declared in the storage, the zero position linked to value in FREE_POINTER
        // 2. 0x0 just meand that it is empty storage and it does not participate in the formation of arrays

        // if(currentPosition == bytes32(0x0)) return bytes32(0x0);
        while (count < index) {
            count++;
            console.log('----');
            console.log('currentPosition b');
            console.logBytes32(currentPosition);
            currentPosition = getNextPosition(currentPosition);
            console.log('currentPosition a');
            console.logBytes32(currentPosition);
        }
        console.log('----1');
        console.log('currentPosition b');
        console.logBytes32(data);
        console.logBytes32(currentPosition);
        (data, np) = getData(currentPosition);
        console.log('currentPosition A');
        console.logBytes32(data);
        console.logBytes32(np);
        console.log('----2');
    }

    function getData(bytes32 position) internal view returns (bytes32 data, bytes32 nextPosition) {
        assembly {
            data := sload(position)
            nextPosition := sload(add(position, 0x20)) // 0x20 is the size from data
        }

        // console.log('123');
        // console.logBytes32(data);
        // console.logBytes32(nextPosition);
        return (data, nextPosition);
    }

    function declare(bytes32 _type, bytes32 arrName) public {
        console.log('declare');
        types[arrName] = _type;
        heads[arrName] = FREE_POINTER;
    }

    function addItem(bytes32 item, bytes32 arrName) public {
        bytes32 previousPosition;
        bytes32 nodePtr = _getEmptyMemoryPosition(); // 0
        // console.log('nodePtr');
        // console.logBytes32(nodePtr);
        // console.logBytes32(heads[arrName]);
        if (heads[arrName] == FREE_POINTER) {
            // Creates first position in array for the first item

            heads[arrName] = nodePtr;
            insertItem(nodePtr, item);
        } else {
            // add the new data to existing position in the array
            bytes32 currentPosition = heads[arrName];

            while (currentPosition != FREE_POINTER) {
                previousPosition = currentPosition;
                (, currentPosition) = getData(currentPosition);
            }
            // bytes32 nextPosition = _getEmptyMemoryPosition();
            // console.log('previousPosition');
            // console.logBytes32(previousPosition);
            // console.log('nextPosition');
            // console.logBytes32(nextPosition);

            insertItem(nodePtr, item);
            updateLinkToNextItem(previousPosition, nodePtr);
        }
    }

    function _getEmptyMemoryPosition() internal returns (bytes32 position) {
        assembly {
            // allocate output byte array
            // position := sload(0x40) // free storage pointer, mload - free memory pointer
            position := msize() // Get the highest available block of memory

            //  including padding from doc
            // 0x40 = free storage pointer + ((62 + 32) + 31) + 4294967264)
            // sstore(0x40, add(position, and(add(add(0x40, 0x20), 0x1f), not(0x1f))))

            // store length in memory (code, size)
            // sstore(position, 0x40)
        }
    }

    function insertItem(bytes32 position, bytes32 _item) public {
        // bytes32 rr;
        // bytes32 rr1;
        console.log('1345--?');
        console.logBytes32(_item);
        console.logBytes32(position);
        assembly {
            sstore(position, _item) // save item
            sstore(
                add(position, 0x20),
                0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
            ) // nextPosition
            // 32 for item + 32 for position = 64 in total = 0x40
            // sstore(0x40, add(position, 0x40)) // new "storage end"
            // rr := sload(position)
            // rr1 := sload(add(position, 0x20))
            sstore(0x40, add(position, and(add(add(0x40, 0x20), 0x1f), not(0x1f))))
        }
        // console.log('345');
        // console.logBytes32(rr);
        // console.logBytes32(rr1);
        // sstore(position, 0x40)
    }

    function updateLinkToNextItem(bytes32 position, bytes32 nextPosition) public {
        // assembly {
        //     sstore(add(position, 0x20), nextPosition)
        // }
    }
}
