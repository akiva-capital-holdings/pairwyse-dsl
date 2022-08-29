// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { IPreprocessor } from './interfaces/IPreprocessor.sol';
import { Stack, StackValue } from './helpers/Stack.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ErrorsPreprocessor } from './libs/Errors.sol';

// import 'hardhat/console.sol';

/**
 * @dev Preprocessor of DSL code
 * @dev This contract is a singleton and should not be deployed more than once
 *
 * TODO: add description about Preprocessor as a single contract of the project
 * It can remove comments that were created by user in the DSL code string. It
 * transforms the users DSL code string to the list of commands that can be used
 * in a Parser contract.
 *
 * DSL code in postfix notation as
 * user's string code -> Preprocessor -> each command is separated in the commands list
 */
contract Preprocessor is IPreprocessor {
    using StringUtils for string;

    // Note: temporary variable
    // param positional number -> parameter itself
    mapping(uint256 => FuncParameter) internal parameters;
    // Note: temporary variable
    string[] internal result; // stores the list of commands after infixToPostfix transformation

    /**
     * @dev The main function that transforms the user's DSL code string to the list of commands.
     *
     * Example:
     * The user's DSL code string is
     * ```
     * uint256 6 setUint256 A
     * ```
     * The end result after executing a `transform()` function is
     * ```
     * ['uint256', '6', 'setUint256', 'A']
     * ```
     *
     * @param _ctxAddr is a context contract address
     * @param _program is a user's DSL code string
     * @return the list of commands that storing `result`
     */
    function transform(address _ctxAddr, string memory _program)
        external
        returns (string[] memory)
    {
        Stack stack = new Stack();
        string[] memory code = split(_program);
        return infixToPostfix(_ctxAddr, code, stack);
    }

    /**
     * @dev Searches the comments in the program and removes comment lines
     * Example:
     * The user's DSL code string is
     * ```
     *  bool true
     *  // uint256 2 * uint256 5
     * ```
     * The end result after executing a `cleanString()` function is
     * ```
     * bool true
     * ```
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

    /**
     * @dev Splits the user's DSL code string to the list of commands
     * avoiding several symbols:
     * - removes additional and useless symbols as ' ', `\\n`
     * - defines and adding help 'end' symbol for the ifelse condition
     * - defines and cleans the code from `{` and `}` symbols
     *
     * Example:
     * The user's DSL code string is
     * ```
     * (loadLocal uint256 TIMESTAMP >    loadLocal uint256 INIT)
     * ```
     * The end result after executing a `split()` function is
     * ```
     * ['loadLocal', 'uint256', 'TIMESTAMP', '>', 'loadLocal', 'uint256', 'INIT']
     * ```
     *
     * @param _program is a user's DSL code string
     * @return the list of commands that storing in `result`
     */
    function split(string memory _program) public returns (string[] memory) {
        delete result;
        string memory buffer;

        for (uint256 i = 0; i < _program.length(); i++) {
            string memory char = _program.char(i);

            // if-else conditions parsing
            if (char.equal('{')) continue;
            if (char.equal('}')) {
                result.push('end');
                continue;
            }

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

    /**
     * @dev Rebuild and transforms the user's DSL commands (can be prepared by
     * the `split()` function) to the list of commands.
     *
     * Example:
     * The user's DSL command contains
     * ```
     * ['1', '+', '2']
     * ```
     * The result after executing a `infixToPostfix()` function is
     * ```
     * ['uint256', '1', 'uint256', '2', '+']
     * ```
     *
     * @param _ctxAddr is a context contract address
     * @param _code is a DSL command list
     * @return _stack uses for getting and storing temporary data to
     * rebuild the list of commands
     */
    function infixToPostfix(
        address _ctxAddr,
        string[] memory _code,
        Stack _stack
    ) public returns (string[] memory) {
        delete result;
        bool isFunc;
        bool isName;
        bool loadRemoteFlag;
        bool loadArrayFlag;
        bool directUseUint256;
        uint256 loadRemoteVarCount;
        uint256 loadArrayVarCount;
        string memory chunk;
        string memory name;

        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];

            // returns true if the chunk can use uint256 directly
            directUseUint256 = _isDirectUseUint256(directUseUint256, chunk);
            // checks and updates if the chunk can use uint256 or it's loadRemote opcode

            (loadRemoteFlag, loadRemoteVarCount) = _updateParams(
                loadRemoteFlag,
                loadRemoteVarCount,
                chunk,
                'loadRemote',
                4
            );

            (loadArrayFlag, loadArrayVarCount) = _updateParams(
                loadArrayFlag,
                loadArrayVarCount,
                chunk,
                'loadArray',
                4
            );

            // Replace alises with base commands
            if (_isAlias(_ctxAddr, chunk)) {
                chunk = IContext(_ctxAddr).aliases(chunk);
            }

            if (_isOperator(_ctxAddr, chunk)) {
                while (
                    _stack.length() > 0 &&
                    IContext(_ctxAddr).opsPriors(chunk) <=
                    IContext(_ctxAddr).opsPriors(_stack.seeLast().getString())
                ) {
                    result.push(_stack.pop().getString());
                }
                _pushStringToStack(_stack, chunk);
            } else if (chunk.equal('(')) {
                _pushStringToStack(_stack, chunk);
            } else if (chunk.equal(')')) {
                while (!_stack.seeLast().getString().equal('(')) {
                    result.push(_stack.pop().getString());
                }
                _stack.pop(); // remove '(' that is left
            } else if (
                !loadRemoteFlag &&
                !loadArrayFlag &&
                chunk.mayBeNumber() &&
                !isFunc &&
                !directUseUint256
            ) {
                _updateUINT256param();
                result.push(_parseNumber(chunk));
            } else if (chunk.mayBeNumber() && !isFunc && directUseUint256) {
                directUseUint256 = false;
                result.push(_parseNumber(chunk));
            } else if (chunk.equal('func')) {
                // if the chunk is 'func' then `Functions block` will occur
                isFunc = true;
            } else if (isFunc && !isName) {
                // `Functions block` started
                // if was not set the name for a function
                (isFunc, isName, name) = _parceFuncMainData(chunk, name, isFunc, isName);
            } else if (isFunc && isName) {
                // `Functions block` finished
                // if it was already set the name for a function
                isName = false;
                isFunc = _parceFuncParams(chunk, name, isFunc);
            } else {
                result.push(chunk);
                if (loadRemoteVarCount == 4) {
                    loadRemoteFlag = false;
                    loadRemoteVarCount = 0;
                }
                if (loadArrayVarCount == 3) {
                    loadArrayFlag = false;
                    loadArrayVarCount = 0;
                }
            }
        }

        while (_stack.length() > 0) {
            result.push(_stack.pop().getString());
        }

        return result;
    }

    /**
     * @dev As the string of values can be simple and complex for DSL this function returns a number in
     * Wei regardless of what type of number parameter was provided by the user.
     * For example:
     * `uint256 1000000` - simple
     * `uint256 1e6 - complex`
     * @param _chunk provided number by the user
     * @return updatedChunk amount in Wei of provided _chunk value
     */
    function _parseNumber(string memory _chunk) internal view returns (string memory updatedChunk) {
        try _chunk.toUint256() {
            updatedChunk = _chunk;
        } catch {
            updatedChunk = _chunk.getWei();
        }
    }

    /**
     * @dev Pushes additional 'uint256' string to results in case, if there are no
     * types provided for uint256 values or
     * loadRemote command, is not in the processing or
     * the last chunk that was added to results is not 'uint256'
     */
    function _updateUINT256param() internal {
        if (result.length == 0 || (!(result[result.length - 1].equal('uint256')))) {
            result.push('uint256');
        }
    }

    /**
     * @dev Checks parameters and updates DSL code depending on what
     * kind of function was provided.
     * This internal function expects 'func' that can be with and without parameters.
     * @param _chunk is a current chunk from the DSL string code
     * @param _currentName is a current name of function
     * @param _isFunc describes if the func opcode was occured
     */
    function _parceFuncParams(
        string memory _chunk,
        string memory _currentName,
        bool _isFunc
    ) internal returns (bool) {
        if (_chunk.equal('endf')) {
            // if the function without parameters
            _pushFuncName(_currentName);
            return false;
        } else {
            // if the function with parameters
            _rebuildParameters(_chunk.toUint256(), _currentName);
            return _isFunc;
        }
    }

    /**
     * @dev Returns updated parameters for the `func` opcode processing
     * Pushes the command that saves parameter in the smart contract instead
     * of the parameters that were provided for parsing.
     * The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
     * remove the parameter like `uint256 7`.
     * The DSL command will be stored before the function body.
     * For the moment it works only with uint256 type.
     * @param _chunk is a current chunk from the DSL string code
     * @param _currentName is a current name of function
     * @param _isFunc describes if the func opcode was occured
     * @param _isName describes if the name for the function was already set
     * @return isFunc the new state of _isFunc for function processing
     * @return isName the new state of _isName for function processing
     * @return name the new name of the function
     */
    function _parceFuncMainData(
        string memory _chunk,
        string memory _currentName,
        bool _isFunc,
        bool _isName
    )
        internal
        pure
        returns (
            bool,
            bool,
            string memory
        )
    {
        if (_chunk.equal('endf')) {
            // finish `Functions block` process
            // example: `func NAME <number_of_params> endf`
            // updates only for: isFunc => false - end of func opcode
            return (false, _isName, _currentName);
        } else {
            // updates only for:
            // isName => true - setting the name of function has occurred
            // name => current cunk
            return (_isFunc, true, _chunk);
        }
    }

    /**
     * @dev Rebuilds parameters to DSL commands in result's list.
     * Pushes the command that saves parameter in the smart contract instead
     * of the parameters that were provided for parsing.
     * The function will store the command like `uint256 7 setUint256 NUMBER_VAR` and
     * remove the parameter like `uint256 7`.
     * The DSL command will be stored before the function body.
     * For the moment it works only with uint256 type.
     * @param _paramsCount is an amount of parameters that provided after
     * the name of function
     * @param _nameOfFunc is a name of function that is used to generate
     * the name of variables
     */
    function _rebuildParameters(uint256 _paramsCount, string memory _nameOfFunc) internal {
        /* 
        `chunks` list needs to store parameters temporarly and rewrite dsl string code

        `_paramsCount * 2` includes type and value for the parameter

        `indexFirst` is an index where the first parameter was pushed to results

        For example:
        if the function has 6 input parameters then the indexFirst will be set in
        the index that shows, where it was the first parameter was stored before
        the 'func', was occurred.
        */

        uint256 _totalParams = _paramsCount * 2;
        require(_paramsCount > 0, ErrorsPreprocessor.PRP1);
        string[] memory chunks = new string[](_totalParams);

        require(result.length >= _totalParams, ErrorsPreprocessor.PRP2);
        uint256 indexFirst = result.length - _totalParams;

        // store paramerets that were already pushed to results
        for (uint256 j = 0; j < _totalParams; j++) {
            chunks[j] = result[indexFirst + j];
        }

        _cleanCode(_totalParams);

        for (uint256 j = 0; j < chunks.length; j += 2) {
            _saveParameter(j, chunks[j], chunks[j + 1], _nameOfFunc);
        }

        _pushParameters(_paramsCount);
        _pushFuncName(_nameOfFunc);
    }

    /**
     * @dev Pushes parameters to result's list depend on their type for each value
     * @param _count is an amount of parameters provided next to the name of func
     */
    function _pushParameters(uint256 _count) internal {
        for (uint256 j = 0; j < _count; j++) {
            FuncParameter memory fp = parameters[j + 1];
            _rebuildParameter(fp._type, fp.value, fp.nameOfVariable);
            // clear mapping data to prevent collisions with values
            parameters[j + 1] = FuncParameter('', '0', '');
        }
    }

    /**
     * @dev Saves parameters in mapping checking/using valid type for each value
     * @param _index is a current chunk index from temporary chunks
     * @param _type is a type of the parameter
     * @param _value is a value of the parameter
     * @param _nameOfFunc is a name of function that is used to generate
     * the name of the current variable
     */
    function _saveParameter(
        uint256 _index,
        string memory _type,
        string memory _value,
        string memory _nameOfFunc
    ) internal {
        FuncParameter storage fp = parameters[_index / 2 + 1];
        fp._type = _type;
        fp.value = _value;
        fp.nameOfVariable = string(
            abi.encodePacked(_nameOfFunc, '_', StringUtils.toString(_index / 2 + 1))
        );
    }

    /**
     * @dev Clears useless variables from the DSL code string as
     * all needed parameters are already stored in chunks list
     * @param _count is an amount of parameters provided next
     * to the name of func. As parameters are stored with their types,
     * the _count variable was already multiplied to 2
     */
    function _cleanCode(uint256 _count) internal {
        for (uint256 j = 0; j < _count; j++) {
            result.pop();
        }
    }

    /**
     * @dev Preparing and pushes the DSL command to results.
     * The comand will save this parameter and its name in the smart contract.
     * For example: `uint256 7 setUint256 NUMBER_VAR`
     * For the moment it works only with uint256 types.
     * @param _type is a type of the parameter
     * @param _value is a value of the parameter
     * @param _variableName is a name of variable that was generated before
     */
    function _rebuildParameter(
        string memory _type,
        string memory _value,
        string memory _variableName
    ) internal {
        // TODO: '_type' - should be used in the future for other types
        result.push(_type);
        result.push(_value);
        // TODO: setUint256 - update for other types in dependence on '_type'
        result.push('setUint256');
        result.push(_variableName);
    }

    /**
     * @dev Pushes the func opcode and the name of the function
     * @param _name is a current name of the function
     */
    function _pushFuncName(string memory _name) internal {
        result.push('func');
        result.push(_name);
    }

    function _pushStringToStack(Stack stack_, string memory value) internal {
        StackValue stackValue = new StackValue();
        stackValue.setString(value);
        stack_.push(stackValue);
    }

    function _isOperator(address _ctxAddr, string memory op) internal view returns (bool) {
        for (uint256 i = 0; i < IContext(_ctxAddr).operatorsLen(); i++) {
            if (op.equal(IContext(_ctxAddr).operators(i))) return true;
        }
        return false;
    }

    /**
     * @dev Checks if a string is an alias to a command from DSL
     */
    function _isAlias(address _ctxAddr, string memory _cmd) internal view returns (bool) {
        return !IContext(_ctxAddr).aliases(_cmd).equal('');
    }

    /**
     * @dev Checks if a symbol is a comment, then increases _index to the next
     * no-comment symbol avoiding an additional iteration
     * @param _index is a current index of a char that might be changed
     * @param _program is a current program string
     * @return new index
     * @return searchedSymbolLen
     * @return isCommeted
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
     * @return index is a new index of a char
     * @return isCommeted
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
     * @dev This function is used to check if 'transferFrom',
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
        if (_chunk.equal('transferFrom') || _chunk.equal('sendEth') || _chunk.equal('transfer')) {
            _isDirect = true;
        }
    }

    /**
     * @dev As 'loadRemote' and 'loadArray' (next load<NAME>) opcodes has 4 and 3 parameters in
     * total and two of some are numbers, so it is important to be sure that executed code under them
     * won't mess parameters with the simple uint256 numbers.
     * @param _loadFlag is used to check if it was started the set of parameters for 'load<NAME>' opcodes
     * @param _loadVarCount is used to check if it was finished the set of parameters for 'load<NAME>' opcodes
     * @param _chunk is a current chunk from the outer function
     * @param _name is a name for certain opcode
     * @param _count is total amount parameters for certain opcode
     * @return flag is an updated or current value of _loadFlag
     * @return count is an updated or current value of _loadVarCount
     */
    function _updateParams(
        bool _loadFlag,
        uint256 _loadVarCount,
        string memory _chunk,
        string memory _name,
        uint256 _count
    ) internal pure returns (bool flag, uint256 count) {
        flag = _loadFlag;
        count = _loadVarCount;

        if (_chunk.equal(_name)) {
            flag = true;
        }

        if (flag && _loadVarCount < _count) {
            count = _loadVarCount + 1;
        }

        return (flag, count);
    }
}
