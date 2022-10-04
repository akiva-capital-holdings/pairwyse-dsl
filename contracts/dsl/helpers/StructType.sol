// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// import 'hardhat/console.sol';

// TODO: make a library
contract StructType {
    // TODO: move all variables to Context
    bytes32 public constant EMPTY = bytes32(type(uint256).max);
    // struct name => (struct key => struct value)
    mapping(bytes32 => mapping(bytes32 => bytes32)) private structs;

    // TODO: need types?

    /**
     * @dev
     * @param _structName is
     * @param _structKey is
     * @return data is a bytecode of the item from the struct or empty bytes if no item exists by this _structKey
     */
    function get(bytes32 _structName, bytes32 _structKey) public view returns (bytes32) {
        // TODO: get from position using hash of _structName + _structKey?
        return structs[_structName][_structKey];
    }

    /**
     * @dev Pushed item to the struct by struct name and key in it
     * @param _structName is
     * @param _structKey is
     * @param _item is
     */
    function addItem(
        bytes32 _structName,
        bytes32 _structKey,
        bytes32 _item
    ) external {
        structs[_structName][_structKey] = _item;
        // TODO: insert in position using hash of _structName + _structKey?
    }
}
