// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';

import "hardhat/console.sol";

contract Preprocessor {
    using StringUtils for string;

    string[] internal result;

    function transform(IContext _ctx, string memory _program) external returns (string[] memory) {
        Stack stack = new Stack();
        string[] memory code = split(_program);
        return infixToPostfix(_ctx, code, stack);
    }

    /**
     * @dev Searches the comments in the program and removes comment lines
     * @param _program is a current program string
     * @return _cleanedProgram new string program that contains only clean code without comments
     */
    function cleanString(string memory _program)
        public
        pure
        returns (string memory _cleanedProgram)
    {
        bool isCommented;

        // searchedSymbolLen is a flag that uses for searching a correct end symbol
        uint256 searchedSymbolLen; // 1 - search \n symbol, 2 - search */ symbol
        uint256 tempIndex; // uses for checking if the index was changed
        uint256 i;
        string memory char;

        while (i < _program.length()) {
            char = _program.char(i);
            tempIndex = i;
            if (isCommented) {
                (tempIndex, isCommented) = _getEndCommentSymbol(
                    searchedSymbolLen,
                    i,
                    _program,
                    char
                );
            } else {
                (searchedSymbolLen, tempIndex, isCommented) = _getCommentSymbol(i, _program, char);
            }

            if (tempIndex > i) {
                i = tempIndex;
                continue;
            }

            if (isCommented) {
                i += 1;
                continue;
            }

            _cleanedProgram = _cleanedProgram.concat(char);
            i += 1;
        }
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

    function isDirectUseUint256(string memory _chunk) returns (bool _isDirectUseUint256){
        if(
            chunk.equal('transferFrom') ||
            chunk.equal('setLocalUint256') ||
            chunk.equal('sendEth') ||
            chunk.equal('transfer')) {
            _isDirectUseUint256 = true;
        }
    }

    function updateRemoteParams(string memory _chunk, uint256 _loadRemoteVarCount) returns (bool _isDirectUseUint256){
        if(
            chunk.equal('transferFrom') ||
            chunk.equal('setLocalUint256') ||
            chunk.equal('sendEth') ||
            chunk.equal('transfer')) {
            _isDirectUseUint256 = true;
        }
    }

    function infixToPostfix(
        IContext _ctx,
        string[] memory _code,
        Stack _stack
    ) public returns (string[] memory) {
        delete result;
        bool loadRemoteFlag;
        bool directUseUint256;
        uint256 loadRemoteVarCount = 3;
        string memory chunk;
        
        string memory res;
        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];
            directUseUint256 = isDirectUseUint256(chunk);
            }

            if(chunk.equal('loadRemote')) {
                loadRemoteFlag = true;
            }

            if(loadRemoteFlag && loadRemoteVarCount > 0) {
                loadRemoteVarCount -= 1;
            } else {
                loadRemoteVarCount = 3;
            }


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
            } else if (mayBeNumber(chunk)) {
                if(!directUseUint256){
                    if(result.length > 0) {
                        res = result[result.length-1];
                        if(loadRemoteFlag == true && loadRemoteVarCount == 0) {
                            result.push('uint256');
                            loadRemoteFlag = false;
                        } else if (!(res.equal('uint256')) && loadRemoteFlag == false) {
                            result.push('uint256');
                        }
                    } else {
                        result.push('uint256');
                    }
                } else {
                    directUseUint256 = false;  
                }
                result.push(chunk);
            } else {
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

    /**
     * @dev Checks if a symbol is a comment, then increases _index to the next
     * no-comment symbol avoiding an additional iteration
     * @param _index is a current index of a char that might be changed
     * @param _program is a current program string
     * @return new index, searchedSymbolLen and isCommeted parameters
     */
    function _getCommentSymbol(
        uint256 _index,
        string memory _program,
        string memory char
    )
        internal
        pure
        returns (
            uint256,
            uint256,
            bool
        )
    {
        if (_canGetSymbol(_index + 1, _program)) {
            string memory nextChar = _program.char(_index + 1);
            if (char.equal('/') && nextChar.equal('/')) {
                return (1, _index + 2, true);
            } else if (char.equal('/') && nextChar.equal('*')) {
                return (2, _index + 2, true);
            }
        }
        return (0, _index, false);
    }

    /**
     * @dev Checks if a symbol is an end symbol of a comment, then increases _index to the next
     * no-comment symbol avoiding an additional iteration
     * @param _i is a current index of a char that might be changed
     * @param _ssl is a searched symbol len that might be 0, 1, 2
     * @param _p is a current program string
     * @return new index and isCommeted parameters
     */
    function _getEndCommentSymbol(uint256 _ssl, uint256 _i, string memory _p, string memory char) 
        internal
        pure
        returns (
            uint256,
            bool
        )
    {
        if (_ssl == 1 && char.equal('\n')) {
            return (_i + 1, false);
        } else if (_ssl == 2 && char.equal('*') && _canGetSymbol(_i + 1, _p)) {
            string memory nextChar = _p.char(_i + 1);
            if (nextChar.equal('/')) {
                return (_i + 2, false);
            }
        }
        return (_i, true);
    }

    /**
     * @dev Checks if it is possible to get next char from a _program
     * @param _index is a current index of a char
     * @param _program is a current program string
     * @return true if program has the next symbol, otherwise is false
     */
    function _canGetSymbol(uint256 _index, string memory _program) internal pure returns (bool) {
        try _program.char(_index) {
            return true;
        } catch Error(string memory) {
            return false;
        }
    }

    function mayBeNumber(string memory _value) public pure returns (bool isNumber) {
        bytes1 _firstByte = bytes(_value)[0];
        if(uint8(_firstByte) >= 48 && uint8(_firstByte) <= 57) {
            isNumber = true;
        }
    }
}
