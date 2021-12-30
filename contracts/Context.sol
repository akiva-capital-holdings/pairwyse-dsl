//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IContext.sol";
import "./Stack.sol";
import "hardhat/console.sol";

contract Context is IContext {
    Stack public override stack;
    bytes public override program;
    uint256 public override pc;
    address public override parser;
    address public override appAddress;
    address public override msgSender;

    mapping(string => bytes1) public opCodeByName; // name => hex
    mapping(bytes1 => bytes4) public selectorByOpcode;
    mapping(string => bytes4) public asmSelectors;

    // baseOpName -> branchCode -> selector;
    mapping(string => mapping(bytes1 => bytes4)) public override branchSelectors;

    // baseOpName -> branchName -> branchCode;
    mapping(string => mapping(string => bytes1)) public branchCodes;

    // modifier onlyParser() {
    //     require(parser == msg.sender, "Caller is not parser");
    //     _;
    // }

    constructor() {
        parser = msg.sender;
        stack = new Stack();
        pc = 0;
    }

    function addOpcode(string memory name, bytes1 opcode, bytes4 opSelector, bytes4 asmSelector) public override {
        require(
            opCodeByName[name] == bytes1(0) && selectorByOpcode[opcode] == bytes4(0),
            "Context: duplicate opcode name or code"
        );
        opCodeByName[name] = opcode;
        selectorByOpcode[opcode] = opSelector;
        asmSelectors[name] = asmSelector;
    }

    function addOpcodeBranch(string memory baseOpName, string memory branchName,
                             bytes1 branchCode, bytes4 selector) public {
        branchSelectors[baseOpName][branchCode] = selector;
        branchCodes[baseOpName][branchName] = branchCode;
    }

    function setProgram(bytes memory data) public virtual override /*onlyParser*/ {
        program = data;
        pc = 0;
    }

    function programAt(uint256 index, uint256 step) public view override returns (bytes memory) {
        bytes memory data = program;
        return this.programSlice(data, index, step);
    }

    function programSlice(
        bytes calldata payload,
        uint256 index,
        uint256 step
    ) public pure override returns (bytes memory) {
        require(payload.length > index, "slicing out of range");
        return payload[index:index + step];
    }

    function setPc(uint256 value) public override {
        pc = value;
    }

    function incPc(uint256 value) public override {
        pc += value;
    }

    function setAppAddress(address addr) public {
        appAddress = addr;
    }

    function setMsgSender(address _msgSender) public {
        msgSender = _msgSender;
    }
}
