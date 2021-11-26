//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Stack.sol";
import "hardhat/console.sol";

contract Context {
    enum BlockField {
        // current block’s base fee (EIP-3198 and EIP-1559)
        BASE_FEE, // 0x00
        // current chain id
        CHAIN_ID, // 0x01
        // current block miner’s address
        COINBASE,
        // current block difficulty
        DIFFICULTY,
        // current block gaslimit
        GASLIMIT,
        // current block number
        NUMBER, // 0x05
        // current block timestamp as seconds since unix epoch
        TIMESTAMP
    }
    
    Stack public stack;
    bytes public program;
    uint public pc;

    constructor() {
        stack = new Stack();
        pc = 0;
    }
    
    function programAt(uint index, uint step) public view returns (bytes memory) {
        bytes memory data = program;
        return this.programSlice(data, index, step);
    }
    
    function programSlice(bytes calldata payload, uint index, uint step) public pure returns (bytes memory) {
        require(payload.length > index, "slicing out of range");
        return payload[index:index + step];
    }
    
    function setPc(uint value) public {
        pc = value;
    }
    
    function incPc(uint value) public {
        pc+= value;
    }
}