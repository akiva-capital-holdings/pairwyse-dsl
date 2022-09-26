// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { IPreprocessor } from './interfaces/IPreprocessor.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ByteUtils } from './libs/ByteUtils.sol';
import { Preprocessor } from './Preprocessor.sol';
import { ErrorsParser } from './libs/Errors.sol';

import 'hardhat/console.sol';

/**
 * @dev Parser of DSL code
 * @dev This contract is a singleton and should not be deployed more than once
 *
 * One of the core contracts of the project. It parses DSL expression
 * that comes from user. After parsing code in Parser
 * a bytecode of the DSL program is generated as stored in Context
 *
 * DSL code in postfix notation as string -> Parser -> raw bytecode
 */
contract Parser is IParser {
    using StringUtils for string;
    // using StringUtils for uint256;
    using ByteUtils for bytes;

    // Note: temporary variables block
    bytes internal program; // raw bytecode of the program that preprocessor is generating
    string[] internal cmds; // DSL code in postfix form (input from Preprocessor)
    uint256 internal cmdIdx; // Current parsing index of DSL code
    mapping(string => uint256) public labelPos;
    mapping(string => bytes) public savedProgram;
    mapping(string => bool) public isVariable;

    // Note: end of temporary variables block

    /**
     * @dev Transform DSL code from array in infix notation to raw bytecode
     * @param _ctxAddr Context contract interface address
     * @param _codeRaw Input code as a string in infix notation
     */
    function parse(
        address _preprAddr,
        address _ctxAddr,
        string memory _codeRaw
    ) external {
        string[] memory _code = IPreprocessor(_preprAddr).transform(_ctxAddr, _codeRaw);
        _parseCode(_ctxAddr, _code);
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
    function asmSetLocalBool() public {
        _parseVariable();
        asmBool();
    }

    /**
     * @dev Updates the program with the local variable value
     *
     *  * Example of a command:
     * ```
     * (uint256 5 + uint256 7) setUint256 VARNAME
     * ```
     */
    function asmSetUint256(address _ctxAddr) public {
        _setVariable(_ctxAddr, cmds[cmdIdx], 'uint256');
        _parseVariable();
    }

    /**
     * @dev Updates the program with the name(its position) of the array
     *
     *  * Example of a command:
     * ```
     * declare ARR_NAME
     * ```
     */
    function asmDeclare(address _ctxAddr) public {
        _parseBranchOf(_ctxAddr, 'declareArr'); // program += bytecode for type of array
        _parseVariable(); // program += bytecode for `ARR_NAME`
    }

    /**
     * @dev Updates the program with the next item for the array
     *
     *  * Example of a command:
     * ```
     * push ITEM ARR_NAME
     * ```
     */
    function asmPush() public {
        asmUint256(); // program += bytecode for ITEM (uint256, address, everything converts to uint256)
        _parseVariable(); // program += bytecode for `NUMBER`
    }

    /**
     * @dev Updates the program with the loadLocal variable
     *
     * Example of command:
     * ```
     * loadLocal uint256 NUMBER
     * ```
     */
    function asmLoadLocal(address _ctxAddr) public {
        _parseBranchOf(_ctxAddr, 'loadLocal'); // program += bytecode for `loadLocal uint256`
        _parseVariable(); // program += bytecode for `NUMBER`
    }

    /**
     * @dev Updates the program with the loadRemote variable
     *
     * Example of a command:
     * ```
     * loadRemote bool MARY_ADDRESS 9A676e781A523b5d0C0e43731313A708CB607508
     * ```
     */
    function asmLoadRemote(address _ctxAddr) public {
        _parseBranchOf(_ctxAddr, 'loadRemote'); // program += bytecode for `loadRemote bool`
        _parseVariable(); // program += bytecode for `MARY_ADDRESS`
        _parseAddress(); // program += bytecode for `9A676e781A523b5...`
    }

    /**
     * @dev Concatenates and updates previous `program` with the `0x01`
     * bytecode of `true` value otherwise `0x00` for `false`
     */
    function asmBool() public {
        bytes1 value = bytes1(_nextCmd().equal('true') ? 0x01 : 0x00);
        program = bytes.concat(program, value);
    }

    /**
     * @dev Concatenates and updates previous `program` with the
     * bytecode of uint256 value
     */
    function asmUint256() public {
        uint256 value = _nextCmd().toUint256();
        program = bytes.concat(program, bytes32(value));
    }

    /**
     * @dev Updates previous `program` with the amount that will be send (in wei)
     *
     * Example of a command:
     * ```
     * sendEth RECEIVER 1234
     * ```
     */
    function asmSend() public {
        _parseVariable(); // program += bytecode for `sendEth RECEIVER`
        asmUint256(); // program += bytecode for `1234`
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
    function asmTransfer() public {
        _parseVariable(); // token address
        _parseVariable(); // receiver address
        asmUint256(); // amount
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
    function asmTransferVar() public {
        _parseVariable(); // token address
        _parseVariable(); // receiver
        _parseVariable(); // amount
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
    function asmTransferFrom() public {
        _parseVariable(); // token address
        _parseVariable(); // from
        _parseVariable(); // to
        asmUint256(); // amount
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
    function asmTransferFromVar() public {
        _parseVariable(); // token address
        _parseVariable(); // from
        _parseVariable(); // to
        _parseVariable(); // amount
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
    function asmBalanceOf() public {
        _parseVariable(); // token address
        _parseVariable(); // user address
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
    function asmIfelse() public {
        string memory _true = _nextCmd(); // "positive" branch name
        string memory _false = _nextCmd(); // "negative" branch name

        labelPos[_true] = program.length; // `positive` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `positive` branch offset

        labelPos[_false] = program.length; // `negative` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `negative` branch offset
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
    function asmIf() public {
        labelPos[_nextCmd()] = program.length; // `true` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `true` branch offset
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
    function asmFunc() public {
        labelPos[_nextCmd()] = program.length; // `name of function` position
        program = bytes.concat(program, bytes2(0)); // placeholder for `name of function` offset
    }

    /**
     * Internal functions
     */

    /**
     * @dev returns `true` if the name of `if/ifelse branch` or `function` exists in the labelPos list
     * otherwise returns `false`
     */
    function _isLabel(string memory _name) internal view returns (bool) {
        return (labelPos[_name] > 0);
    }

    /**
     * @dev Сonverts a list of commands to bytecode
     */
    function _parseCode(address _ctxAddr, string[] memory code) internal {
        delete program;
        cmdIdx = 0;
        cmds = code;

        IContext(_ctxAddr).setPc(0);
        IContext(_ctxAddr).stack().clear();

        while (cmdIdx < cmds.length) {
            _parseOpcodeWithParams(_ctxAddr);
        }

        // TODO: Parser: IContext(_ctxAddr).delegateCall('setProgram', program) to pass owner's
        //       address to the Context contract
        IContext(_ctxAddr).setProgram(program);
    }

    /**
     * @dev Updates the bytecode `program` in dependence on
     * commands that were provided in `cmds` list
     */
    function _parseOpcodeWithParams(address _ctxAddr) internal {
        string storage cmd = _nextCmd();

        bytes1 opcode = IContext(_ctxAddr).opCodeByName(cmd);
        require(
            opcode != 0x0 || _isLabel(cmd) || isVariable[cmd],
            string(abi.encodePacked('Parser: "', cmd, '" command is unknown'))
        );

        if (isVariable[cmd]) {
            // if the variable was saved before its loading, so the concatenation
            // will gather the current program and a prepared loading program for this variable
            program = bytes.concat(program, savedProgram[cmd]);
        } else if (_isLabel(cmd)) {
            uint256 _branchLocation = program.length;
            bytes memory programBefore = program.slice(0, labelPos[cmd]);
            bytes memory programAfter = program.slice(labelPos[cmd] + 2, program.length);
            program = bytes.concat(programBefore, bytes2(uint16(_branchLocation)), programAfter);
        } else {
            program = bytes.concat(program, opcode);
            bytes4 _selector = IContext(_ctxAddr).asmSelectors(cmd);
            if (_selector != 0x0) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSelector(_selector, IContext(_ctxAddr))
                );
                require(success, ErrorsParser.PRS1);
            }
        }
        // if no selector then opcode without params
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
    function _parseVariable() internal {
        program = bytes.concat(program, bytes4(keccak256(abi.encodePacked(_nextCmd()))));
    }

    /**
     * @dev Updates previous `program` with the branch name, like `loadLocal` or `loadRemote`
     * of command and its additional used type
     */
    function _parseBranchOf(address _ctxAddr, string memory baseOpName) internal {
        program = bytes.concat(program, IContext(_ctxAddr).branchCodes(baseOpName, _nextCmd()));
    }

    /**
     * @dev Updates previous `program` with the address command that is a value
     */
    function _parseAddress() internal {
        program = bytes.concat(program, _nextCmd().fromHex());
    }

    /**
     * @dev Sets additional program for saved parameter, so it can be
     * possible to load the variable directly.
     *
     *
     * For example:
     * The base command of loading stored NUMBER parameter can be used as
     * ```
     * (uint256 5 + uint256 7) setUint256 NUMBER
     * (loadLocal uint256 NUMBER + 4) setUint256 NUMBER2
     * ```
     * so, _setVariable function participates in the simplification of loading NUMBER
     *
     * ```
     * (uint256 5 + uint256 7) setUint256 NUMBER
     * (NUMBER + 4) setUint256 NUMBER2
     *
     * @param _ctxAddr is a Context contract address
     * @param _name is a name of a global variable for storing in the contract
     * @param _type is a type of a global variable for storing
     * ```
     */
    function _setVariable(
        address _ctxAddr,
        string memory _name,
        string memory _type
    ) internal {
        require(!_name.equal(''), ErrorsParser.PRS2);
        isVariable[_name] = true;

        string memory _loadType = 'loadLocal';
        bytes4 name_ = bytes4(keccak256(abi.encodePacked(_name)));
        bytes1 type_ = IContext(_ctxAddr).opCodeByName(_loadType);
        bytes1 code_ = IContext(_ctxAddr).branchCodes(_loadType, _type);

        // ex. savedProgram['NUMBER'] = 'loadLocal uint256 NUMBER'
        savedProgram[_name] = bytes.concat(type_, code_, name_);
    }
}
