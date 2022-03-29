// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';

// import "hardhat/console.sol";

contract Preprocessor {
    using StringUtils for string;

    string[] internal result;

    function transform(IContext _ctx, string memory _program) external returns (string[] memory) {
        Stack stack = new Stack();
        _program = cleanProgram(_program);
        string[] memory code = split(_program);
        return infixToPostfix(_ctx, code, stack);
    }

    function split(string memory _program) public returns (string[] memory) {
        delete result;
        string memory buffer;

        // console.log("program len: %s", program.length());
        for (uint256 i = 0; i < _program.length(); i++) {
            string memory char = _program.char(i);

            // if-else conditions parsing
            if (char.equal('{')) continue;
            if (char.equal('}')) {
                result.push('end');
                continue;
            }

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

    function infixToPostfix(
        IContext _ctx,
        string[] memory _code,
        Stack _stack
    ) public returns (string[] memory) {
        delete result;
        string memory chunk;
        // console.log("\n\n", chunk);

        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];

            if (isOperator(_ctx, chunk)) {
                // console.log("%s is an operator", chunk);
                while (
                    _stack.length() > 0 &&
                    _ctx.opsPriors(chunk) <= _ctx.opsPriors(_stack.seeLast().getString())
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

    function isOperator(IContext _ctx, string memory op) internal view returns (bool) {
        for (uint256 i = 0; i < _ctx.operatorsLen(); i++) {
            if (op.equal(_ctx.operators(i))) return true;
        }
        return false;
    }

    /*
        This function is removing one/multi line
        comments from the program.
    */
    function cleanProgram(string memory _program) public returns (string memory _result) {
        string memory char;
        for (uint256 i = 0; i < _program.length(); i++) {
            char = _program.char(i);
            if(char.equal('/') && i+1 <= _program.length()) {
                char = _program.char(i+1);
                // find the end symbol '\n' and rewrite the main index
                if(char.equal('*')) {
                    i = _findEndMultiSymbol(i+1, _program);
                } else if(char.equal('/')) {
                    i = _findEndSymbol(i+1, _program);
                }
            } else {
                _result = _result.concat(char);
            }
        }
    }

    /*
        Returns the index of the '\n' symbol or
        the index of the last symbol of the program
    */
    function _findEndSymbol(uint256 _indexStart, string memory _program) internal pure returns (uint256) {
        string memory char;
        for (uint256 indexEnd = _indexStart; indexEnd < _program.length(); indexEnd++) {
            char = _program.char(indexEnd);
            if(char.equal('\n')) {
                return indexEnd;
            }
        }
        return _program.length()-1;
    }

    /*
        Returns the index of the end of comment or
        the index of the last symbol of the program
    */
    function _findEndMultiSymbol(uint256 _indexStart, string memory _program) internal pure returns (uint256) {
        string memory char;
        for (uint256 indexEnd = _indexStart; indexEnd < _program.length(); indexEnd++) {
            char = _program.char(indexEnd);
            if(char.equal('*') && indexEnd+1 <= _program.length()) {
                char = _program.char(indexEnd+1);
                if(char.equal('/')) {
                    return indexEnd+1;
                }
            }
        }
        return _program.length()-1;
    }
}
