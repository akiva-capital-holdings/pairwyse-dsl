// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IDSLContext } from './interfaces/IDSLContext.sol';
import { IProgramContext } from './interfaces/IProgramContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { IPreprocessor } from './interfaces/IPreprocessor.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ByteUtils } from './libs/ByteUtils.sol';
import { Preprocessor } from './Preprocessor.sol';
import { ErrorsParser } from './libs/Errors.sol';

// import 'hardhat/console.sol';

/**
 * @dev Parser of DSL code. This contract is a singleton and should not
 * be deployed more than once
 *
 * One of the core contracts of the project. It parses DSL expression
 * that comes from user. After parsing code in Parser
 * a bytecode of the DSL program is generated as stored in ProgramContext
 *
 * DSL code in postfix notation as string -> Parser -> raw bytecode
 */
contract Parser is IParser {
    using StringUtils for string;
    using ByteUtils for bytes;

    string[] internal cmds; // DSL code in postfix form (output of Preprocessor)
    uint256 internal cmdIdx; // Current parsing index of DSL code

    /**
     * @dev Transform DSL code from array in infix notation to raw bytecode
     * @param _dslCtxAddr DSLContext contract address
     * @param _programCtxAddr ProgramContext contract address
     * @param _codeRaw Input code as a string in infix notation
     */
    function parse(
        address _preprAddr,
        address _dslCtxAddr,
        address _programCtxAddr,
        string memory _codeRaw
    ) external {
        string[] memory _code = IPreprocessor(_preprAddr).transform(_dslCtxAddr, _codeRaw);
        parseCode(_dslCtxAddr, _programCtxAddr, _code);
    }

    /**
     * @dev Сonverts a list of commands to bytecode
     */
    function parseCode(address _dslCtxAddr, address _programCtxAddr, string[] memory _code) public {
        cmdIdx = 0;
        bytes memory b;
        bytes memory program;

        IProgramContext(_programCtxAddr).setProgram(b); // TODO: set to 0 that program in the program context
        _setCmdsArray(_code); // remove empty strings
        IProgramContext(_programCtxAddr).setPc(0);
        IProgramContext(_programCtxAddr).stack().clear();

        while (cmdIdx < cmds.length) {
            program = _parseOpcodeWithParams(_dslCtxAddr, _programCtxAddr, program);
        }
        IProgramContext(_programCtxAddr).setProgram(program);
    }

    /**
     * @dev Asm functions
     * Concatenates the previous program bytecode with the next command
     * that contains in the `cmds` list. `cmdIdx` is helping to follow
     * what exactly the command is in the process
     * Example of code for :
     * ```
     * cmds = ['bool', 'true'] // current cmds
     * cmdIdx = 0 // current parsing index of DSL code
     * program = ''
     * ```
     *
     * So it will be executed the asmSetLocalBool() function where:
     * - `_parseVariable()` internal function will update the previous empty
     * `program` with the bytecode of `bool` opcode
     *
     * Result is `program = '0x18'` (see Context.sol for `addOpcode('bool'..)`
     * to check the code for `bool` opcode)
     * cmdIdx = 0 // current parsing index of DSL code is the same
     *
     * - `asmBool()` function will concatenate previous `program` with the bytecode of `true` value
     * `program` with the bytecode `0x01` (see return values for Parser.sol for `asmBool()` function
     *
     * ```
     * cmdIdx = 1 // parsing index of DSL code was updated
     * program = '0x1801'
     * ```
     */

    /**
     * @dev Updates the program with the bool value
     *
     * Example of a command:
     * ```
     * bool true
     * ```
     */
    function asmSetLocalBool(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program);
        newProgram = asmBool(newProgram, address(0), address(0));
    }

    /**
     * @dev Updates the program with the local variable value
     *
     * Example of a command:
     * ```
     * (uint256 5 + uint256 7) setUint256 VARNAME
     * ```
     */
    function asmSetUint256(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        return _parseVariable(_program);
    }

    /**
     * @dev Updates the program with the name(its position) of the array
     *
     * Example of a command:
     * ```
     * declare ARR_NAME
     * ```
     */
    function asmDeclare(
        bytes memory _program,
        address _ctxDSLAddr,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseBranchOf(_program, _ctxDSLAddr, 'declareArr'); // program += bytecode for type of array
        newProgram = _parseVariable(newProgram); // program += bytecode for `ARR_NAME`
    }

    /**
     * @dev Updates the program with the element by index from the provived array's name
     *
     * Example of a command:
     * ```
     * get 3 USERS
     * ```
     */
    function asmGet(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        string memory _value = _nextCmd();
        bytes4 _arrName = bytes4(keccak256(abi.encodePacked(_nextCmd())));
        newProgram = bytes.concat(_program, bytes32(_value.toUint256()), _arrName);
    }

    /**
     * @dev Updates the program with the new item for the array, can be `uint256`,
     * `address` and `struct name` types.
     *
     * Example of a command:
     * ```
     * push ITEM ARR_NAME
     * ```
     */
    function asmPush(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        string memory _value = _nextCmd();
        bytes4 _arrName = bytes4(keccak256(abi.encodePacked(_nextCmd())));

        if (_value.mayBeAddress()) {
            bytes memory _sliced = bytes(_value).slice(2, 42); // without first `0x` symbols
            newProgram = bytes.concat(_program, bytes32(_sliced.fromHexBytes()));
        } else if (_value.mayBeNumber()) {
            newProgram = bytes.concat(_program, bytes32(_value.toUint256()));
        } else {
            // only for struct names!
            newProgram = bytes.concat(
                _program,
                bytes32(bytes4(keccak256(abi.encodePacked(_value))))
            );
        }

        newProgram = bytes.concat(newProgram, _arrName);
    }

    /**
     * @dev Updates the program with the loadLocal variable
     *
     * Example of command:
     * ```
     * var NUMBER
     * ```
     */
    function asmVar(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program);
    }

    /**
     * @dev Updates the program with the loadRemote variable
     *
     * Example of a command:
     * ```
     * loadRemote bool MARY_ADDRESS 9A676e781A523b5d0C0e43731313A708CB607508
     * ```
     */
    function asmLoadRemote(
        bytes memory _program,
        address _ctxDSLAddr,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseBranchOf(_program, _ctxDSLAddr, 'loadRemote'); // program += bytecode for `loadRemote bool`
        newProgram = _parseVariable(newProgram); // program += bytecode for `MARY_ADDRESS`
        newProgram = _parseAddress(newProgram); // program += bytecode for `9A676e781A523b5...`
    }

    /**
     * @dev Concatenates and updates previous `program` with the `0x01`
     * bytecode of `true` value otherwise `0x00` for `false`
     */
    function asmBool(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        bytes1 value = bytes1(_nextCmd().equal('true') ? 0x01 : 0x00);
        newProgram = bytes.concat(_program, value);
    }

    /**
     * @dev Concatenates and updates previous `program` with the
     * bytecode of uint256 value
     */
    function asmUint256(bytes memory _program, address, address) public returns (bytes memory) {
        uint256 value = _nextCmd().toUint256();
        return bytes.concat(_program, bytes32(value));
    }

    /**
     * @dev Updates previous `program` with the amount that will be send (in wei)
     *
     * Example of a command:
     * ```
     * sendEth RECEIVER 1234
     * ```
     */
    function asmSend(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // program += bytecode for `sendEth RECEIVER`
        newProgram = asmUint256(newProgram, address(0), address(0)); // program += bytecode for `1234`
    }

    /**
     * @dev Updates previous `program` with the amount of tokens
     * that will be transfer to reciever(in wei). The `TOKEN` and `RECEIVER`
     * parameters should be stored in smart contract
     *
     * Example of a command:
     * ```
     * transfer TOKEN RECEIVER 1234
     * ```
     */
    function asmTransfer(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // token address
        newProgram = _parseVariable(newProgram); // receiver address
        newProgram = asmUint256(newProgram, address(0), address(0)); // amount
    }

    /**
     * @dev Updates previous `program` with the amount of tokens
     * that will be transfer to reciever(in wei). The `TOKEN`, `RECEIVER`, `AMOUNT`
     * parameters should be stored in smart contract
     *
     * Example of a command:
     * ```
     * transferVar TOKEN RECEIVER AMOUNT
     * ```
     */
    function asmTransferVar(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // token address
        newProgram = _parseVariable(newProgram); // receiver
        newProgram = _parseVariable(newProgram); // amount
    }

    /**
     * @dev Updates previous `program` with the amount of tokens
     * that will be transfer from the certain address to reciever(in wei).
     * The `TOKEN`, `FROM`, `TO` address parameters should be stored in smart contract
     *
     * Example of a command:
     * ```
     * transferFrom TOKEN FROM TO 1234
     * ```
     */
    function asmTransferFrom(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // token address
        newProgram = _parseVariable(newProgram); // from
        newProgram = _parseVariable(newProgram); // to
        newProgram = asmUint256(newProgram, address(0), address(0)); // amount
    }

    /**
     * @dev Updates previous `program` with the amount of tokens
     * that will be transfer from the certain address to reciever(in wei).
     * The `TOKEN`, `FROM`, `TO`, `AMOUNT` parameters should be stored in smart contract
     *
     * Example of a command:
     * ```
     * transferFromVar TOKEN FROM TO AMOUNT
     * ```
     */
    function asmTransferFromVar(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // token address
        newProgram = _parseVariable(newProgram); // from
        newProgram = _parseVariable(newProgram); // to
        newProgram = _parseVariable(newProgram); // amount
    }

    /**
     * @dev Updates previous `program` with getting the amount of tokens
     * The `TOKEN`, `USER` address parameters should be stored in smart contract
     *
     * Example of a command:
     * ```
     * balanceOf TOKEN USER
     * ```
     */
    function asmBalanceOf(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // token address
        newProgram = _parseVariable(newProgram); // user address
    }

    /**
     * @dev Updates previous `program` with getting the length of the dsl array by its name
     * The command return non zero value only if the array name was declared and have at least one value.
     * Check: `declareArr` and `push` commands for DSL arrays
     *
     * Example of a command:
     * ```
     * lengthOf ARR_NAME
     * ```
     */
    function asmLengthOf(bytes memory _program, address, address) public returns (bytes memory) {
        return _parseVariable(_program); // array name
    }

    /**
     * @dev Updates previous `program` with the name of the dsl array that will
     * be used to sum uint256 variables
     *
     * Example of a command:
     * ```
     * sumOf ARR_NAME
     * ```
     */
    function asmSumOf(bytes memory _program, address, address) public returns (bytes memory) {
        return _parseVariable(_program); // array name
    }

    /**
     * @dev Updates previous `program` with the name of the dsl array and
     * name of variable in the DSL structure that will
     * be used to sum uint256 variables
     *
     * Example of a command:
     * ```
     * struct BOB {
     *   lastPayment: 3
     * }
     *
     * struct ALISA {
     *   lastPayment: 300
     * }
     *
     * sumThroughStructs USERS.lastPayment
     * or shorter version
     * sumOf USERS.lastPayment
     * ```
     */
    function asmSumThroughStructs(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program); // array name
        newProgram = _parseVariable(newProgram); // variable name
    }

    /**
     * @dev Updates previous `program` for positive and negative branch position
     *
     * Example of a command:
     * ```
     * 6 > 5 // condition is here must return true or false
     * ifelse AA BB
     * end
     *
     * branch AA {
     *   // code for `positive` branch
     * }
     *
     * branch BB {
     *   // code for `negative` branch
     * }
     * ```
     */
    function asmIfelse(
        bytes memory _program,
        address,
        address _programCtxAddr
    ) public returns (bytes memory newProgram) {
        string memory _true = _nextCmd(); // "positive" branch name
        string memory _false = _nextCmd(); // "negative" branch name
        // set `positive` branch position
        _setLabelPos(_programCtxAddr, _true, _program.length);
        newProgram = bytes.concat(_program, bytes2(0)); // placeholder for `positive` branch offset
        // set `negative` branch position
        _setLabelPos(_programCtxAddr, _false, newProgram.length);
        newProgram = bytes.concat(newProgram, bytes2(0)); // placeholder for `negative` branch offset
    }

    /**
     * @dev Updates previous `program` for positive branch position
     *
     * Example of a command:
     * ```
     * 6 > 5 // condition is here must return true or false
     * if POSITIVE_ACTION
     * end
     *
     * POSITIVE_ACTION {
     *   // code for `positive` branch
     * }
     * ```
     */
    function asmIf(
        bytes memory _program,
        address,
        address _programCtxAddr
    ) public returns (bytes memory newProgram) {
        _setLabelPos(_programCtxAddr, _nextCmd(), _program.length);
        newProgram = bytes.concat(_program, bytes2(0)); // placeholder for `true` branch offset
    }

    /**
     * @dev Updates previous `program` for function code
     *
     * Example of a command:
     * ```
     * func NAME_OF_FUNCTION
     *
     * NAME_OF_FUNCTION {
     *   // code for the body of function
     * }
     * ```
     */
    function asmFunc(
        bytes memory _program,
        address,
        address _programCtxAddr
    ) public returns (bytes memory newProgram) {
        // set `name of function` position
        _setLabelPos(_programCtxAddr, _nextCmd(), _program.length);
        newProgram = bytes.concat(_program, bytes2(0)); // placeholder for `name of function` offset
    }

    /**
     * @dev Updates previous `program` for DSL struct.
     * This function rebuilds variable parameters using a name of the structure, dot symbol
     * and the name of each parameter in the structure
     *
     * Example of DSL command:
     * ```
     * struct BOB {
     *   account: 0x47f8a90ede3d84c7c0166bd84a4635e4675accfc,
     *   lastPayment: 3
     * }
     * ```
     *
     * Example of commands that uses for this functions:
     * `cmds = ['struct', 'BOB', 'lastPayment', '3', 'account', '0x47f..', 'endStruct']`
     *
     * `endStruct` word is used as an indicator for the ending loop for the structs parameters
     */
    function asmStruct(
        bytes memory _program,
        address,
        address _programCtxAddr
    ) public returns (bytes memory newProgram) {
        // parse the name of structure - `BOB`
        string memory _structName = _nextCmd();
        newProgram = _program;
        // parsing name/value parameters till found the 'endStruct' word
        do {
            // parse the name of variable - `balance`, `account`
            string memory _variable = _nextCmd();
            // create the struct name of variable - `BOB.balance`, `BOB.account`
            string memory _name = _structName.concat('.').concat(_variable);
            // TODO: let's think how not to use setter in Parser here..
            IProgramContext(_programCtxAddr).setStructVars(_structName, _variable, _name);
            // TODO: store sertain bytes for each word separate in bytes string?
            newProgram = bytes.concat(newProgram, bytes4(keccak256(abi.encodePacked(_name))));
            // parse the value of `balance` variable - `456`, `0x345...`
            string memory _value = _nextCmd();
            if (_value.mayBeAddress()) {
                // remove first `0x` symbols
                bytes memory _sliced = bytes(_value).slice(2, 42);
                newProgram = bytes.concat(newProgram, bytes32(_sliced.fromHexBytes()));
            } else if (_value.mayBeNumber()) {
                newProgram = bytes.concat(newProgram, bytes32(_value.toUint256()));
            } else if (_variable.equal('vote') && _value.equal('YES')) {
                // voting process, change stored value in the array 1
                newProgram = bytes.concat(newProgram, bytes32(uint256(1)));
            } else if (_variable.equal('vote') && _value.equal('NO')) {
                // voting process, change stored value in the array to 0
                newProgram = bytes.concat(newProgram, bytes32(0));
            }
            // else {
            //     // if the name of the variable
            //     program = bytes.concat(program, bytes32(keccak256(abi.encodePacked(_value))));
            // }
        } while (!(cmds[cmdIdx].equal('endStruct')));

        newProgram = _parseVariable(newProgram); // parse the 'endStruct' word
    }

    /**
     * @dev Parses variable names in for-loop & skip the unnecessary `in` parameter
     * Ex. ['for', 'LP_INITIAL', 'in', 'LPS_INITIAL']
     */
    function asmForLoop(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        // parse temporary variable name
        newProgram = _parseVariable(_program);
        _nextCmd(); // skip `in` keyword
        newProgram = _parseVariable(newProgram);
    }

    /**
     * @dev Parses the `record id` and the `agreement address` parameters
     * Ex. ['enableRecord', 'RECORD_ID', 'at', 'AGREEMENT_ADDRESS']
     */
    function asmEnableRecord(
        bytes memory _program,
        address,
        address
    ) public returns (bytes memory newProgram) {
        newProgram = _parseVariable(_program);
        _nextCmd(); // skip `at` keyword
        newProgram = _parseVariable(newProgram);
    }

    /**
     * Internal functions
     */

    /**
     * @dev returns `true` if the name of `if/ifelse branch` or `function` exists in the labelPos list
     * otherwise returns `false`
     */
    function _isLabel(address _programCtxAddr, string memory _name) internal view returns (bool) {
        return _getLabelPos(_programCtxAddr, _name) > 0;
    }

    function _getLabelPos(
        address _programCtxAddr,
        string memory _name
    ) internal view returns (uint256) {
        return IProgramContext(_programCtxAddr).labelPos(_name);
    }

    /**
     * @dev Updates the bytecode `program` in dependence on
     * commands that were provided in `cmds` list
     */
    function _parseOpcodeWithParams(
        address _dslCtxAddr,
        address _programCtxAddr,
        bytes memory _program
    ) internal returns (bytes memory newProgram) {
        string storage cmd = _nextCmd();

        bytes1 opcode = IDSLContext(_dslCtxAddr).opCodeByName(cmd);

        // TODO: simplify
        bytes4 _selector = bytes4(keccak256(abi.encodePacked(cmd)));
        bool isStructVar = IProgramContext(_programCtxAddr).isStructVar(cmd);
        if (_isLabel(_programCtxAddr, cmd)) {
            bytes2 _branchLocation = bytes2(uint16(_program.length));
            uint256 labelPos = _getLabelPos(_programCtxAddr, cmd);
            newProgram = bytes.concat(
                _program.slice(0, labelPos), // programBefore
                _branchLocation,
                _program.slice(labelPos + 2, _program.length) // programAfter
            );

            // TODO: move isValidVarName() check to Preprocessor
            //       (it should automatically add `var` before all variable names)
        } else if (cmd.isValidVarName() || isStructVar) {
            opcode = IDSLContext(_dslCtxAddr).opCodeByName('var');
            newProgram = bytes.concat(_program, opcode, _selector);
        } else if (opcode == 0x0) {
            revert(string(abi.encodePacked('Parser: "', cmd, '" command is unknown')));
        } else {
            newProgram = bytes.concat(_program, opcode);

            _selector = IDSLContext(_dslCtxAddr).asmSelectors(cmd);
            if (_selector != 0x0) {
                // TODO: address, address
                (bool success, bytes memory data) = address(this).delegatecall(
                    abi.encodeWithSelector(_selector, newProgram, _dslCtxAddr, _programCtxAddr)
                );
                require(success, ErrorsParser.PRS1);
                newProgram = abi.decode(data, (bytes));
            }
            // if no selector then opcode without params
        }
    }

    /**
     * @dev Returns next commad from the cmds list, increases the
     * command index `cmdIdx` by 1
     * @return nextCmd string
     */
    function _nextCmd() internal returns (string storage) {
        return cmds[cmdIdx++];
    }

    /**
     * @dev Updates previous `program` with the next provided command
     */
    function _parseVariable(bytes memory _program) internal returns (bytes memory newProgram) {
        bytes4 _cmd = bytes4(keccak256(abi.encodePacked(_nextCmd())));
        newProgram = bytes.concat(_program, _cmd);
    }

    /**
     * @dev Updates previous `program` with the branch name, like `loadLocal` or `loadRemote`
     * of command and its additional used type
     */
    function _parseBranchOf(
        bytes memory _program,
        address _ctxDSLAddr,
        string memory baseOpName
    ) internal returns (bytes memory newProgram) {
        newProgram = bytes.concat(
            _program,
            IDSLContext(_ctxDSLAddr).branchCodes(baseOpName, _nextCmd())
        );
    }

    /**
     * @dev Updates previous `program` with the address command that is a value
     */
    function _parseAddress(bytes memory _program) internal returns (bytes memory newProgram) {
        string memory _addr = _nextCmd();
        _addr = _addr.substr(2, _addr.length()); // cut `0x` from the beginning of the address
        newProgram = bytes.concat(_program, _addr.fromHex());
    }

    /**
     * @dev Deletes empty elements from the _input array and sets the result as a `cmds` storage array
     */
    function _setCmdsArray(string[] memory _input) internal {
        uint256 i;
        delete cmds;

        while (i < _input.length && !_input[i].equal('')) {
            cmds.push(_input[i++]);
        }
    }

    function _setLabelPos(address _programCtxAddr, string memory _name, uint256 _value) internal {
        IProgramContext(_programCtxAddr).setLabelPos(_name, _value);
    }
}
