// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';

// import "hardhat/console.sol";

contract Preprocessor {
    using StringUtils for string;

    mapping(string => uint256) internal opsPriors;
    string[] internal result;
    string[] public operators;

    // Note: bigger number => bigger priority
    function addOperator(string memory _op, uint256 _priority) external {
        opsPriors[_op] = _priority;
        operators.push(_op);
    }

    function transform(string memory _program) external returns (string[] memory) {
        Stack stack = new Stack();
        string[] memory code = split(_program);
        return infixToPostfix(code, stack);
    }

    function split(string memory _program) public returns (string[] memory) {
        delete result;
        string memory buffer;

        // console.log("program len: %s", program.length());
        for (uint256 i = 0; i < _program.length(); i++) {
            string memory char = _program.char(i);
            // console.log("char: %s", char);
            if (char.equal(' ') || char.equal('\n') || char.equal('(') || char.equal(')')) {
                if (buffer.length() > 0) {
                    result.push(buffer);
                    buffer = '';
                }
            } else {
                buffer = buffer.concat(char);
            }

            if (char.equal('(') || char.equal(')')) {
                result.push(char);
            }
        }

        if (buffer.length() > 0) {
            result.push(buffer);
            buffer = '';
        }

        return result;
    }

    function infixToPostfix(string[] memory _code, Stack _stack) public returns (string[] memory) {
        delete result;
        string memory chunk;
        // console.log("\n\n", chunk);

        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];

            if (isOperator(chunk)) {
                // console.log("%s is an operator", chunk);
                while (
                    _stack.length() > 0 &&
                    opsPriors[chunk] <= opsPriors[_stack.seeLast().getString()]
                ) {
                    // console.log("result push:", _stack.seeLast().getString());
                    result.push(_stack.pop().getString());
                }
                pushStringToStack(_stack, chunk);
            } else if (chunk.equal('(')) {
                pushStringToStack(_stack, chunk);
            } else if (chunk.equal(')')) {
                while (!_stack.seeLast().getString().equal('(')) {
                    // console.log("result push: %s", _stack.seeLast().getString());
                    result.push(_stack.pop().getString());
                }
                _stack.pop(); // remove '(' that is left
            } else {
                // operand found
                // console.log("result push: %s", chunk);
                result.push(chunk);
            }
        }

        while (_stack.length() > 0) {
            // console.log("result push: %s", _stack.seeLast().getString());
            result.push(_stack.pop().getString());
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
