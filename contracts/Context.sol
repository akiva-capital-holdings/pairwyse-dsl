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

    bytes4 internal constant NUMBER = bytes4(keccak256("NUMBER"));
    bytes4 internal constant NUMBER2 = bytes4(keccak256("NUMBER2"));
    
    Stack public stack;
    
    bytes public program;
    
    uint public pc;

    constructor() {
        console.logBytes4(NUMBER);
        console.logBytes4(NUMBER2);
        stack = new Stack();
        pc = 0;
//        program = bytes(uint8(BlockField.NUMBER));
    }

    function getNumber() public view returns(uint256) {
        return getStorageUint256(NUMBER);
    }

    function setNumber(uint256 number) public {
        setStorageUint256(NUMBER, number);
    }

    function getStorageUint256(bytes32 position) public view returns (uint256 data) {
        console.log("getStorageUint256");
        console.logBytes32(position);
        assembly { data := sload(position) }
    }

    function setStorageUint256(bytes32 position, uint256 data) public {
        console.log("setStorageUint256");
        console.logBytes32(position);
        assembly { sstore(position, data) }
    }
    
    function programAt(uint index, uint step) public view returns (bytes memory) {
        bytes memory data = program;
        
        return this.programSlice(data, index, step);
    }
    
    function programSlice(bytes calldata payload, uint index, uint step) public pure returns (bytes memory) {
        require(payload.length > index, "slicing out of range");
        
//        console.log("index %s", index);
//        console.logBytes(payload);
//        console.logBytes(payload[index:index + 1]);
        

        return payload[index:index + step];
    }
    
    function setPc(uint value) public {
        pc = value;
    }
    
    function incPc(uint value) public {
        pc+= value;
    }
}