// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IContext } from './interfaces/IContext.sol';
import { IPreprocessor } from './interfaces/IPreprocessor.sol';
import { StringStack } from './helpers/StringStack.sol';
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

    // Stack with elements of type string that is used to temporarily store data of `infixToPostfix` function
    StringStack internal strStack;

    bytes1 private DOT_SYMBOL = 0x2e;

    constructor() {
        strStack = new StringStack();
    }

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
        string[] memory code = split(_program);
        return infixToPostfix(_ctxAddr, code, strStack);
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
     * (var TIMESTAMP > var INIT)
     * ```
     * The end result after executing a `split()` function is
     * ```
     * ['var', 'TIMESTAMP', '>', 'var', 'INIT']
     * ```
     *
     * @param _program is a user's DSL code string
     * @return the list of commands that storing in `result`
     */
    function split(string memory _program) public returns (string[] memory) {
        delete result;
        string memory buffer;
        bool isStructStart;
        bool isLoopStart;

        for (uint256 i = 0; i < _program.length(); i++) {
            string memory char = _program.char(i);

            // if-else conditions parsing
            if (isLoopStart && char.equal('{')) {
                result.push('startLoop');
                continue;
            } else if (char.equal('{')) continue;

            // ---> start block for DSL struct without types
            if ((char.equal(':') || char.equal(',')) && isStructStart) {
                result.push(buffer);
                buffer = '';
                continue;
            } else if (char.equal('{')) continue;

            if (isStructStart && char.equal('}')) {
                if (!(buffer.equal('') || buffer.equal(' '))) result.push(buffer);
                // `endStruct` word is used as an indicator for the ending
                // loop for the structs parameters
                result.push('endStruct');
                buffer = '';
                isStructStart = false;
                continue;
            } else if (isLoopStart && char.equal('}')) {
                // `endLoop` keyword is an indicator of the loop block end
                result.push('endLoop');
                isLoopStart = false;
                continue;
            } else if (char.equal('}')) {
                result.push('end');
                continue;
            }
            // <--- end block for DSL struct without types

            if (
                char.equal(' ') ||
                char.equal('\n') ||
                char.equal('(') ||
                char.equal(')') ||
                char.equal('[') ||
                char.equal(']') ||
                char.equal(',')
            ) {
                if (buffer.length() > 0) {
                    result.push(buffer);
                    buffer = '';
                }
            } else {
                buffer = buffer.concat(char);
            }

            if (char.equal('(') || char.equal(')') || char.equal('[') || char.equal(']')) {
                result.push(char);
            }

            // struct start
            if (result.length > 0 && !isStructStart && result[result.length - 1].equal('struct')) {
                isStructStart = true;
            }
            // loop start
            if (result.length > 0 && !isStructStart && result[result.length - 1].equal('for')) {
                isLoopStart = true;
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
     * @return _stack uses for getting and storing temporary string data
     * rebuild the list of commands
     */
    function infixToPostfix(
        address _ctxAddr,
        string[] memory _code,
        StringStack _stack
    ) public returns (string[] memory) {
        PreprocessorInfo memory s;
        // helps to separate a struct variable name and array's name for arrays with type `struct`
        bool checkStructName;
        string memory chunk;

        // Cleanup
        delete result;
        _stack.clear();

        // Infix to postfix
        for (uint256 i = 0; i < _code.length; i++) {
            chunk = _code[i];

            if (
                result.length > 0 &&
                result[result.length - 1].equal('record') &&
                chunk.mayBeNumber()
            ) {
                result.pop(); // 'record' word does not need anymore
                result.push(chunk); // push the record ID to results
                continue;
            }

            // ---> starts sumOf block for array of structures
            if (chunk.equal('sumOf')) {
                checkStructName = true;
                continue;
            }

            if (checkStructName) {
                // returns success=true if user provides complex name, ex. `USERS.balance`
                // where arrName = USERS, structVar = balance
                (bool success, string memory arrName, string memory structVar) = _getNames(chunk);
                if (success) {
                    // use another internal command to sum variables - `sumThroughStructs`
                    result.push('sumThroughStructs');
                    result.push(arrName);
                    result.push(structVar);
                } else {
                    // use simple sum command `sumOf`
                    result.push('sumOf');
                    result.push(chunk);
                }
                checkStructName = false;
                continue;
            }
            // <--- ends sumOf block for array of structures

            // struct
            if (chunk.equal('struct')) {
                s.isStructStart = true;
                result.push(chunk);
                continue;
            }
            if (chunk.equal('endStruct')) {
                s.isStructStart = false;
                result.push(chunk);
                continue;
            }

            // returns true if the chunk can use uint256 directly
            s.directUseUint256 = _isDirectUseUint256(s.directUseUint256, s.isStructStart, chunk);
            // checks and updates if the chunk can use uint256 or it's loadRemote opcode
            (s.loadRemoteFlag, s.loadRemoteVarCount) = _updateRemoteParams(
                s.loadRemoteFlag,
                s.loadRemoteVarCount,
                chunk
            );

            // ---> start block for DSL arrays without types
            // TODO: code for array tasks will be added below
            if (chunk.equal('[') && !s.isArrayStart) {
                s.isArrayStart = true;
                continue;
            } else if (s.isArrayStart && chunk.equal(']')) {
                continue;
            } else if (s.isArrayStart && !chunk.equal(']')) {
                if (result.length > 0) {
                    string memory _type = result[result.length - 1];
                    result.pop();
                    // TODO: move that to Parser or reorganise it to simple array structure?
                    // EX. NUMBERS [1,2,3,4...]
                    result.push('declareArr');
                    result.push(_type);
                    result.push(chunk);
                }

                s.isArrayStart = false;
                continue;
            }

            if (chunk.equal('insert') && s.insertStep != 1) {
                s.insertStep = 1;
                result.push('push');
                continue;
            } else if (s.insertStep == 1 && !chunk.equal('into')) {
                s.insertStep = 2;
                result.push(chunk);
                continue;
            } else if (s.insertStep == 2) {
                if (!chunk.equal('into')) {
                    result.push(chunk);
                    s.insertStep = 0;
                }
                continue;
            }
            // <--- end block for DSL arrays

            // Replace alises with base commands
            if (_isAlias(_ctxAddr, chunk)) {
                chunk = IContext(_ctxAddr).aliases(chunk);
            }

            if (_isOperator(_ctxAddr, chunk)) {
                while (
                    _stack.length() > 0 &&
                    IContext(_ctxAddr).opsPriors(chunk) <=
                    IContext(_ctxAddr).opsPriors(_stack.seeLast())
                ) {
                    result.push(_stack.pop());
                }
                _stack.push(chunk);
            } else if (chunk.equal('(')) {
                _stack.push(chunk);
            } else if (chunk.equal(')')) {
                while (!_stack.seeLast().equal('(')) {
                    result.push(_stack.pop());
                }
                _stack.pop(); // remove '(' that is left
            } else if (
                !s.loadRemoteFlag && chunk.mayBeNumber() && !s.isFunc && !s.directUseUint256
            ) {
                _updateUINT256param();
                if (i + 1 <= _code.length - 1) {
                    result.push(_parseChunk(chunk, _getMultiplier(_code[i + 1])));
                } else {
                    result.push(_parseChunk(chunk, 0));
                }
            } else if (
                !chunk.mayBeAddress() && chunk.mayBeNumber() && !s.isFunc && s.directUseUint256
            ) {
                s.directUseUint256 = false;
                if (i + 1 <= _code.length - 1) {
                    result.push(_parseChunk(chunk, _getMultiplier(_code[i + 1])));
                } else {
                    result.push(_parseChunk(chunk, 0));
                }
            } else if (chunk.equal('func')) {
                // if the chunk is 'func' then `Functions block` will occur
                s.isFunc = true;
            } else if (s.isFunc && !s.isName) {
                // `Functions block` started
                // if was not set the name for a function
                (s.isFunc, s.isName, s.name) = _parseFuncMainData(
                    chunk,
                    s.name,
                    s.isFunc,
                    s.isName
                );
            } else if (s.isFunc && s.isName) {
                // `Functions block` finished
                // if it was already set the name for a function
                s.isName = false;
                s.isFunc = _parseFuncParams(chunk, s.name, s.isFunc);
            } else if (_isCurrencySymbol(chunk)) {
                // we've already transformed the number before the keyword
                // so we can safely skip the chunk
                continue;
            } else {
                result.push(chunk);
                if (s.loadRemoteVarCount == 4) {
                    s.loadRemoteFlag = false;
                    s.loadRemoteVarCount = 0;
                }
            }
        }

        while (_stack.length() > 0) {
            result.push(_stack.pop());
        }
        return result;
    }

    /**
     * @dev checks the value, and returns the corresponding multiplier.
     * If it is Ether, then it returns 1000000000000000000,
     * If it is GWEI, then it returns 1000000000
     * @param _chunk is a command from DSL command list
     * @return returns the corresponding multiplier.
     */
    function _getMultiplier(string memory _chunk) internal pure returns (uint256) {
        if (_chunk.equal('ETH')) {
            return 1000000000000000000;
        } else if (_chunk.equal('GWEI')) {
            return 1000000000;
        } else return 0;
    }

    /**
     * @dev Searching for a `.` (dot) symbol  and returns names status for complex string name.
     * Ex. `USERS.balance`:
     * Where `success` = true`,
     * `arrName` = `USERS`,
     * `structVar` = `balance`; otherwise it returns `success` = false` with empty string results
     * @param _chunk is a command from DSL command list
     * @return success if user provides complex name,  result is true
     * @return arrName if user provided complex name, result is the name of structure
     * @return structVar if user provided complex name, result is the name of structure variable
     */
    function _getNames(string memory _chunk)
        internal
        view
        returns (
            bool success,
            string memory arrName,
            string memory structVar
        )
    {
        // TODO: decrease amount of iterations
        bytes memory symbols = bytes(_chunk);
        bool isFound; // dot was found
        for (uint256 i = 0; i < symbols.length; i++) {
            if (!isFound) {
                if (symbols[i] == DOT_SYMBOL) {
                    isFound = true;
                    continue;
                }
                arrName = arrName.concat(string(abi.encodePacked(symbols[i])));
            } else {
                structVar = structVar.concat(string(abi.encodePacked(symbols[i])));
            }
        }
        if (isFound) return (true, arrName, structVar);
    }

    /**
     * @dev returned parsed chunk, values can be address with 0x parameter or be uint256 type
     * @param _chunk provided string
     * @param _currencyMultiplier provided number of the multiplier
     * @return updated _chunk value in dependence on its type
     */
    function _parseChunk(string memory _chunk, uint256 _currencyMultiplier)
        internal
        pure
        returns (string memory)
    {
        if (_chunk.mayBeAddress()) return _chunk;
        return _parseNumber(_chunk, _currencyMultiplier);
    }

    /**
     * @dev As the string of values can be simple and complex for DSL this function returns a number in
     * Wei regardless of what type of number parameter was provided by the user.
     * For example:
     * `uint256 1000000` - simple
     * `uint256 1e6 - complex`
     * @param _chunk provided number
     * @param _currencyMultiplier provided number of the multiplier
     * @return updatedChunk amount in Wei of provided _chunk value
     */
    function _parseNumber(string memory _chunk, uint256 _currencyMultiplier)
        internal
        pure
        returns (string memory updatedChunk)
    {
        if (_currencyMultiplier > 0) {
            try _chunk.toUint256() {
                updatedChunk = StringUtils.toString(_chunk.toUint256() * _currencyMultiplier);
            } catch {
                updatedChunk = StringUtils.toString(
                    _chunk.getWei().toUint256() * _currencyMultiplier
                );
            }
        } else {
            try _chunk.toUint256() {
                updatedChunk = _chunk;
            } catch {
                updatedChunk = _chunk.getWei();
            }
        }
    }

    /**
     * @dev Check is chunk is a currency symbol
     * @param _chunk is a current chunk from the DSL string code
     * @return true or false based on whether chunk is a currency symbol or not
     */
    function _isCurrencySymbol(string memory _chunk) internal pure returns (bool) {
        if (_chunk.equal('ETH') || _chunk.equal('GWEI')) return true;
        return false;
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
    function _parseFuncParams(
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
    function _parseFuncMainData(
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
    function _isDirectUseUint256(
        bool _directUseUint256,
        bool _isStruct,
        string memory _chunk
    ) internal pure returns (bool _isDirect) {
        _isDirect = _directUseUint256;
        if (
            _chunk.equal('transferFrom') ||
            _chunk.equal('sendEth') ||
            _chunk.equal('transfer') ||
            _chunk.equal('get') ||
            _chunk.equal('enable') ||
            _isStruct
        ) {
            _isDirect = true;
        }
    }

    /**
     * @dev As a 'loadRemote' opcode has 4 parameters in total and two of them are
     * numbers, so it is important to be sure that executed code under 'loadRemote'
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
        _count = _loadRemoteVarCount;
        _flag = _loadRemoteFlag;

        if (_chunk.equal('loadRemote')) {
            _flag = true;
        }

        if (_flag && _loadRemoteVarCount < 4) {
            _count = _loadRemoteVarCount + 1;
        }

        return (_flag, _count);
    }
}
