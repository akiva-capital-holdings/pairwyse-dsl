//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract StackValue {
    enum StackType {
        // NONE in an OpSpec shows that the op pops or yields nothing
        NONE,
        // UINT256 in an OpSpec shows that the op pops or yields a uint256
        UINT256
    }

    StackType private _type;

    uint256 private _uint256;

    function getUint256() public view returns (uint256) {
        require(_type == StackType.UINT256, "uint256 type mismatch");
        
        return _uint256;
    }
    
    function setUint256(uint256 value) public {
        _uint256 = value;
        _type = StackType.UINT256;
    }
    
    function getType() public view returns (StackType) {
        return _type;
    }
}

contract Stack {
    StackValue[] public stack;
    
    function length() view public returns (uint) {
        return stack.length;
    }
    
    function push(StackValue data) public {
        stack.push(data);
    }
    
    function pop() public returns (StackValue) {
        StackValue data = stack[stack.length - 1];
        stack.pop();
        
        return data;
    }
}
