//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract StackValue {
    enum StackType {
        // NONE in an OpSpec shows that the op pops or yields nothing
        NONE,
        // UINT256 in an OpSpec shows that the op pops or yields a uint256
        UINT256,
        STRING
    }

    StackType private _type;

    uint256 private _uint256;
    string private _string;

    function getUint256() public view returns (uint256) {
        require(_type == StackType.UINT256, "uint256 type mismatch");
        return _uint256;
    }

    function setUint256(uint256 value) public {
        _uint256 = value;
        _type = StackType.UINT256;
    }

    function getString() public view returns (string memory) {
        require(_type == StackType.STRING, "string type mismatch");
        return _string;
    }

    function setString(string memory value) public {
        _string = value;
        _type = StackType.STRING;
    }

    function getType() public view returns (StackType) {
        return _type;
    }
}

contract Stack {
    StackValue[] public stack;

    function length() external view returns (uint256) {
        return stack.length;
    }

    function seeLast() external view returns (StackValue) {
        return stack[stack.length - 1];
    }

    function push(StackValue data) external {
        stack.push(data);
    }

    function pop() external returns (StackValue) {
        StackValue data = stack[stack.length - 1];
        stack.pop();

        return data;
    }

    function clear() external {
        delete stack;
    }
}
