//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IContext.sol";
import "./Stack.sol";
import "hardhat/console.sol";

contract Context is IContext {

    Stack public override stack;
    bytes public override program;
    uint public override pc;

    constructor() {
        stack = new Stack();
        pc = 0;
    }
    
    function programAt(uint index, uint step) public view override returns (bytes memory) {
        bytes memory data = program;
        return this.programSlice(data, index, step);
    }
    
    function programSlice(bytes calldata payload, uint index, uint step) public pure override returns (bytes memory) {
        require(payload.length > index, "slicing out of range");
        return payload[index:index + step];
    }
    
    function setPc(uint value) public override {
        pc = value;
    }
    
    function incPc(uint value) public override {
        pc+= value;
    }
}