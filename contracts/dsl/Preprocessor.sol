// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';

import 'hardhat/console.sol';

contract Preprocessor {
    using StringUtils for string;
    struct FuncParameter {
        string _type;
        string nameOfVariable;
        string value;
    }
    mapping(uint256 => FuncParameter) parameters;
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

    function infixToPostfix(
        IContext _ctx,
        string[] memory _code,
        Stack _stack
    ) public returns (string[] memory) {
        delete result;
        bool isFunc;
        bool isName;
        string memory name;

        bool loadRemoteFlag;
        bool directUseUint256;
        uint256 loadRemoteVarCount = 3;
        uint256 paramsCount;
        string memory chunk;
        string memory res;

        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];

            // returns true if the chunk can use uint256 directly
            directUseUint256 = _isDirectUseUint256(directUseUint256, chunk);
            // checks and updates if the chunk can use uint256 or it's loadRemote opcode
            (loadRemoteFlag, loadRemoteVarCount) = _updateRemoteParams(
                loadRemoteFlag,
                loadRemoteVarCount,
                chunk
            );

            // Replace alises with base commands
            if (_isAlias(_ctx, chunk)) {
                chunk = _ctx.aliases(chunk);
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
            } else if (_mayBeNumber(chunk) && !isFunc) {
                if (!directUseUint256) {
                    if (result.length > 0) {
                        res = result[result.length - 1];
                        // push additional 'uint256' if was not set before in results and
                        // if it is not a 'loadRemote' execution
                        if (!(res.equal('uint256')) && loadRemoteFlag == false) {
                            result.push('uint256');
                        }
                    } else {
                        result.push('uint256');
                    }
                } else {
                    directUseUint256 = false;
                }
                result.push(chunk);
            } else if (chunk.equal('func')) {
                isFunc = true;
                paramsCount = 0;
            } else if (isFunc) {
                if (!isName) {
                    if (chunk.equal('end')) {
                        isFunc = false;
                        // result.push(chunk);
                    } else {
                        isName = true;
                        name = chunk;
                    }
                } else {
                    isName = false;
                    paramsCount = _parseInt(chunk);
                    string[] memory chunks = new string[](paramsCount * 2);
                    // add parameters to the chunks without vice versa way
                    // an index where the first variable stored will be updated by new code
                    uint256 indexFirst = result.length - paramsCount * 2;
                    for (uint256 j = 0; j < paramsCount * 2; j++) {
                        // make shift for result's values
                        // to be sure that variables get proper index name
                        chunks[j] = result[indexFirst + j];
                    }

                    for (uint256 j = 0; j < paramsCount * 2; j++) {
                        result.pop();
                    }

                    for (uint256 j = 0; j < chunks.length; j += 2) {
                        FuncParameter storage fp = parameters[j / 2 + 1];
                        fp._type = chunks[j];
                        fp.value = chunks[j + 1];
                        fp.nameOfVariable = string(
                            abi.encodePacked(name, '_', _toString(j / 2 + 1))
                        );
                    }

                    for (uint256 j = 0; j < paramsCount; j++) {
                        FuncParameter memory fp = parameters[j + 1];
                        result.push(fp._type); // should be used in the future for other types
                        result.push(fp.value);
                        result.push('setUint256');
                        result.push(fp.nameOfVariable);
                    }

                    result.push('func');
                    result.push(name);
                    result.push('end');
                }
            } else {
                // console.log('--',chunk);
                result.push(chunk);
            }
        }

        while (_stack.length() > 0) {
            console.log('result push: %s', _stack.seeLast().getString());
            result.push(_stack.pop().getString());
        }

        return result;
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return '0';
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * Parse Int
     *
     * Converts an ASCII string value into an uint as long as the string
     * its self is a valid unsigned integer
     *
     * @param _value The ASCII string to be converted to an unsigned integer
     * @return _ret The unsigned value of the ASCII string
     */
    function _parseInt(string memory _value) internal pure returns (uint256 _ret) {
        bytes memory _bytesValue = bytes(_value);
        uint256 j = 1;
        uint256 i = _bytesValue.length - 1;
        while (i >= 0) {
            assert(uint8(_bytesValue[i]) >= 48 && uint8(_bytesValue[i]) <= 57);
            _ret += (uint8(_bytesValue[i]) - 48) * j;
            j *= 10;
            if (i > 0) {
                i--;
            } else {
                break;
            }
        }
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
     * @dev Checks if a string is an alias to a command from DSL
     */
    function _isAlias(IContext _ctx, string memory _cmd) internal view returns (bool) {
        return !_ctx.aliases(_cmd).equal('');
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
    function _getEndCommentSymbol(
        uint256 _ssl,
        uint256 _i,
        string memory _p,
        string memory char
    ) internal pure returns (uint256, bool) {
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

    /**
     * @dev If the string starts with a number, so we assume that it's a number.
     * @param _value is a current chunk
     * @return isNumber that is true if the string starts with a number, otherwise is false
     */
    function _mayBeNumber(string memory _value) internal pure returns (bool isNumber) {
        bytes1 _firstByte = bytes(_value)[0];
        if (uint8(_firstByte) >= 48 && uint8(_firstByte) <= 57) {
            isNumber = true;
        }
    }

    /**
     * @dev This function is used to check if 'transferFrom', 'setLocalUint256',
     * 'sendEth' and 'transfer' functions(opcodes) won't use 'uint256' opcode during code
     * execution directly. So it needs to be sure that executed code won't mess up
     * parameters for the simple number and a number that be used for these functions.
     * @param _directUseUint256 set by default from the outer function. Allows to keep current state of a contract
     * @param _chunk is a current chunk from the outer function
     * @return _isDirect is true if a chunk is matched one from the opcode list, otherwise is false
     */
    function _isDirectUseUint256(bool _directUseUint256, string memory _chunk)
        internal
        pure
        returns (bool _isDirect)
    {
        _isDirect = _directUseUint256;
        if (
            _chunk.equal('transferFrom') ||
            _chunk.equal('setLocalUint256') ||
            _chunk.equal('sendEth') ||
            _chunk.equal('transfer')
        ) {
            _isDirect = true;
        }
    }

    /**
     * @dev As a 'loadRemote' opcode has 4 parameters and two of them are
     * numbers it is important to be sure that executed code under 'loadRemote'
     * won't mess parameters with the simple uint256 numbers.
     * @param _loadRemoteFlag is used to check if it was started the set of parameters for 'loadRemote' opcode
     * @param _loadRemoteVarCount is used to check if it was finished the set of parameters for 'loadRemote' opcode
     * @param _chunk is a current chunk from the outer function
     * @return _flag is an updated or current value of _loadRemoteFlag
     * @return _count is an updated or current value of _loadRemoteVarCount
     */
    function _updateRemoteParams(
        bool _loadRemoteFlag,
        uint256 _loadRemoteVarCount,
        string memory _chunk
    ) internal pure returns (bool _flag, uint256 _count) {
        _count = 3;
        _flag = _loadRemoteFlag;

        if (_chunk.equal('loadRemote')) {
            _flag = true;
        }

        if (_flag && _loadRemoteVarCount > 0) {
            _count = _loadRemoteVarCount - 1;
        }
        return (_flag, _count);
    }
}
