// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ByteUtils } from './libs/ByteUtils.sol';
import { Storage } from './helpers/Storage.sol';
import { Preprocessor } from './Preprocessor.sol';

// import 'hardhat/console.sol';

/**
 * @dev Parser of DSL code
 *
 * One of the core contracts of the project. It parses DSL expression that comes from user. After parsing code in Parser
 * a bytecode of the DSL program is generated as stored in Context
 *
 * DSL code in postfix notation as string -> Parser -> raw bytecode
 */
contract Parser is IParser, Storage {
    using StringUtils for string;
    using ByteUtils for bytes;

    Preprocessor public preprocessor;

    bytes internal program; // raw bytecode of the program that preprocessor is generating
    string[] internal cmds; // DSL code in postfix form (input from Preprocessor)
    uint256 internal cmdIdx; // Current parsing index of DSL code

    mapping(string => uint256) public labelPos;

    constructor() {
        preprocessor = new Preprocessor(); // TODO: provide as input param
    }

    /**
     * @dev Transform DSL code from array in infix notation to raw bytecode
     * @param _ctx Context contract interface
     * @param _codeRaw Input code as a string in infix notation
     */
    function parse(IContext _ctx, string memory _codeRaw) external {
        // TODO: in func params change `IContext` type to `address`
        string[] memory _code = preprocessor.transform(_ctx, _codeRaw);
        _parseCode(_ctx, _code);
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
     - `asmBool()` function will concatenate previous `program` with the bytecode of `true` value
     * `program` with the bytecode of `true` value (0x01)
     * ```
     * program = '0x1801'
     * ```
     */

    /**
     * @dev Updates the program with the bool value
     */
    function asmSetLocalBool() public {
        _parseVariable();
        asmBool();
    }

    /**
     * @dev Updates the program with the local variable value
     * Example of command:
     * ```
     * setLocalUint256 VARNAME 12345
     * ```
     */
    function asmSetLocalUint256() public {
        _parseVariable();
        asmUint256();
    }

    /**
     * @dev Updates the program with the
     *  * Example of command:
     * ```
     * (uint256 5 + uint256 7) setUint256 VARNAME
     * ```
     */
    function asmSetUint256() public {
        _parseVariable();
    }

    /**
     * @dev
     */
    function asmLoadLocal(IContext _ctx) public {
        _parseBranchOf(_ctx, 'loadLocal');
        _parseVariable();
    }

    /**
     * @dev
     */
    function asmLoadRemote(IContext _ctx) public {
        _parseBranchOf(_ctx, 'loadRemote');
        _parseVariable();
        _parseAddress();
    }

    /**
     * @dev
     */
    function asmBool() public {
        bytes1 value = bytes1(_nextCmd().equal('true') ? 0x01 : 0x00);
        program = bytes.concat(program, value);
    }

    /**
     * @dev
     */
    function asmUint256() public {
        uint256 value = _nextCmd().toUint256();
        program = bytes.concat(program, bytes32(value));
    }

    /**
     * @dev
     */
    function asmSend() public {
        _parseVariable();
        asmUint256();
    }

    /**
     * @dev
     */
    function asmTransfer() public {
        _parseVariable(); // token address
        _parseVariable(); // receiver
        asmUint256(); // amount
    }

    /**
     * @dev
     */
    function asmTransferVar() public {
        _parseVariable(); // token address
        _parseVariable(); // receiver
        _parseVariable(); // amount
    }

    /**
     * @dev
     */
    function asmTransferFrom() public {
        _parseVariable(); // token address
        _parseVariable(); // from
        _parseVariable(); // to
        asmUint256(); // amount
    }

    /**
     * @dev
     */
    function asmTransferFromVar() public {
        _parseVariable(); // token address
        _parseVariable(); // from
        _parseVariable(); // to
        _parseVariable(); // amount
    }

    /**
     * @dev
     */
    function asmBalanceOf() public {
        _parseVariable(); // token address
        _parseVariable(); // user address
    }

    /**
     * @dev
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
     * @dev
     */
    function asmIf() public {
        labelPos[_nextCmd()] = program.length; // `true` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `true` branch offset
    }

    function asmFunc() public {
        labelPos[nextCmd()] = program.length; // `true` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `true` branch offset
    }

    /**
     * Internal functions
     */

    /**
     * @dev
     */
    function _isLabel(string memory _name) internal view returns (bool) {
        return (labelPos[_name] > 0);
    }

    /**
     * @dev
     */
    function _parseCode(IContext _ctx, string[] memory code) internal {
        delete program;
        cmdIdx = 0;
        cmds = code;
        _ctx.setPc(0);
        _ctx.stack().clear();

        while (cmdIdx < cmds.length) {
            _parseOpcodeWithParams(_ctx);
        }

        // console.logBytes(program);
        _ctx.setProgram(program);
    }

    /**
     * @dev
     */
    function _parseOpcodeWithParams(IContext _ctx) internal {
        string storage cmd = _nextCmd();
        bytes1 opcode = _ctx.opCodeByName(cmd);
        require(
            opcode != 0x0 || _isLabel(cmd),
            string(abi.encodePacked('Parser: "', cmd, '" command is unknown'))
        );
        if (_isLabel(cmd)) {
            uint256 _branchLocation = program.length;
            bytes memory programBefore = program.slice(0, labelPos[cmd]);
            bytes memory programAfter = program.slice(labelPos[cmd] + 2, program.length);
            program = bytes.concat(programBefore, bytes2(uint16(_branchLocation)), programAfter);
        } else {
            program = bytes.concat(program, opcode);

            bytes4 _selector = _ctx.asmSelectors(cmd);
            if (_selector != 0x0) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSelector(_selector, _ctx)
                );
                require(success, 'Parser: delegatecall to asmSelector failed');
            }
        }
        // if no selector then opcode without params
    }

    /**
     * @dev next commad from the cmds list
     * @return nextCmd string
     */
    function _nextCmd() internal returns (string storage) {
        return cmds[cmdIdx++];
    }

    /**
     * @dev
     */
    function _parseVariable() internal {
        program = bytes.concat(program, bytes4(keccak256(abi.encodePacked(_nextCmd()))));
    }

    /**
     * @dev
     */
    function _parseBranchOf(IContext _ctx, string memory baseOpName) internal {
        program = bytes.concat(program, _ctx.branchCodes(baseOpName, _nextCmd()));
    }

    /**
     * @dev
     */
    function _parseAddress() internal {
        program = bytes.concat(program, _nextCmd().fromHex());
    }
}
