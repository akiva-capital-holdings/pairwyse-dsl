// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Stack, StackValue } from "./helpers/Stack.sol";
import { StringUtils } from "./libs/StringUtils.sol";

// import "hardhat/console.sol";

contract Preprocessor {
    using StringUtils for string;

    Stack internal stack;
    mapping(string => uint256) internal opsPriors;
    string[] internal result;
    string[] public operators;

    constructor() {
        stack = new Stack();
    }

    // Note: bigger number => bigger priority
    function addOperator(string memory _op, uint256 _priority) external {
        opsPriors[_op] = _priority;
        operators.push(_op);
    }

    function transform(string memory program) external returns (string[] memory) {
        string[] memory code = split(program);
        return infixToPostfix(code);
    }

    function split(string memory program) public returns (string[] memory) {
        delete result;
        string memory buffer;

        // console.log("program len: %s", program.length());
        for (uint256 i = 0; i < program.length(); i++) {
            string memory char = program.char(i);
            // console.log("char: %s", char);
            if (char.equal(" ") || char.equal("\n") || char.equal("(") || char.equal(")")) {
                if (buffer.length() > 0) {
                    result.push(buffer);
                    buffer = "";
                }
            } else {
                buffer = buffer.concat(char);
            }

            if (char.equal("(") || char.equal(")")) {
                result.push(char);
            }
        }

        if (buffer.length() > 0) {
            result.push(buffer);
            buffer = "";
        }

        return result;
    }

    function infixToPostfix(string[] memory code) public returns (string[] memory) {
        delete result;
        string memory chunk;
        // console.log("\n\n", chunk);

        for (uint256 i = 0; i < code.length; i++) {
            chunk = code[i];

            if (isOperator(chunk)) {
                // console.log("%s is an operator", chunk);
                while (stack.length() > 0 && opsPriors[chunk] <= opsPriors[stack.seeLast().getString()]) {
                    // console.log("result push:", stack.seeLast().getString());
                    result.push(stack.pop().getString());
                }
                pushStringToStack(stack, chunk);
            } else if (chunk.equal("(")) {
                pushStringToStack(stack, chunk);
            } else if (chunk.equal(")")) {
                while (!stack.seeLast().getString().equal("(")) {
                    // console.log("result push: %s", stack.seeLast().getString());
                    result.push(stack.pop().getString());
                }
                stack.pop(); // remove '(' that is left
            } else {
                // operand found
                // console.log("result push: %s", chunk);
                result.push(chunk);
            }
        }

        while (stack.length() > 0) {
            // console.log("result push: %s", stack.seeLast().getString());
            result.push(stack.pop().getString());
        }

        return result;
    }

    function pushStringToStack(Stack stack_, string memory value) internal {
        StackValue stackValue = new StackValue();
        stackValue.setString(value);
        stack_.push(stackValue);
    }

    function isOperator(string memory op) internal view returns (bool) {
        for (uint256 i = 0; i < operators.length; i++) {
            if (op.equal(operators[i])) return true;
        }
        return false;
    }
}
