// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { Storage } from './helpers/Storage.sol';
import { Preprocessor } from './Preprocessor.sol';

import 'hardhat/console.sol';

contract Parser is IParser, Storage {
    using StringUtils for string;

    Preprocessor public preprocessor;

    bytes internal program;
    string[] internal cmds;
    uint256 internal cmdIdx;

    mapping(string => uint256) public labelPos;

    constructor() {
        preprocessor = new Preprocessor();
    }

    function parse(IContext _ctx, string memory _codeRaw) external {
        string[] memory _code = preprocessor.transform(_ctx, _codeRaw);
        parseCode(_ctx, _code);
    }

    /**
     * Asm functions
     */

    function asmSetLocalBool() public {
        parseVariable();
        asmBool();
    }

    function asmLoadLocal(IContext _ctx) public {
        parseBranchOf(_ctx, 'loadLocal');
        parseVariable();
    }

    function asmLoadRemote(IContext _ctx) public {
        parseBranchOf(_ctx, 'loadRemote');
        parseVariable();
        parseAddress();
    }

    function asmBool() public {
        bytes1 value = bytes1(nextCmd().equal('true') ? 0x01 : 0x00);
        program = bytes.concat(program, value);
    }

    function asmUint256() public {
        uint256 value = nextCmd().toUint256();
        program = bytes.concat(program, bytes32(value));
    }

    function asmSend() public {
        parseVariable();
        asmUint256();
    }

    function asmTransfer() public {
        parseAddress();
        parseVariable();
        asmUint256();
    }

    function asmTransferFrom() public {
        parseVariable();
        parseVariable();
        parseVariable();
        asmUint256();
    }

    // TODO: clean up
    function asmBnz() public {
        console.log('asmBnz');

        string memory _true = nextCmd();
        string memory _false = nextCmd();

        labelPos[_true] = program.length; // `true` branch ...
        console.log('true =', program.length);
        program = bytes.concat(program, bytes2(0)); // placeholder for `true` branch offset

        // uint256 TRUE_BRANCH_POS_SIZE = 2;
        labelPos[_false] = program.length; // `false` branch ...
        console.log('false =', program.length);
        program = bytes.concat(program, bytes2(0)); // placeholder for `false` branch offset

        // console.log('bnz location =', _bnzLocation);
        console.logBytes(program);
    }

    /**
     * Internal functions
     */

    function isLabel(string memory _name) internal view returns (bool) {
        return (labelPos[_name] > 0);
    }

    function parseCode(IContext _ctx, string[] memory code) internal {
        delete program;
        cmdIdx = 0;
        cmds = code;
        _ctx.setPc(0);
        _ctx.stack().clear();

        while (cmdIdx < cmds.length) {
            parseOpcodeWithParams(_ctx);
        }

        console.logBytes(program);
        _ctx.setProgram(program);
    }

    // TODO: clean up
    function parseOpcodeWithParams(IContext _ctx) internal {
        string storage cmd = nextCmd();
        bytes1 opcode = _ctx.opCodeByName(cmd);

        require(
            opcode != 0x0 || isLabel(cmd),
            string(abi.encodePacked('Parser: "', cmd, '" command is unknown'))
        );

        if (isLabel(cmd)) {
            console.log(cmd);
            console.log('...is a label');
            console.log('program.length =', program.length);
            console.log('label pos =', labelPos[cmd]);
            uint256 _branchLocation = program.length; /* - labelPos[cmd]*/
            console.log('branch location =', _branchLocation);
            // console.logBytes(program);
            bytes memory programBefore = this.slice(program, 0, labelPos[cmd]);
            // bytes memory branchPositionStorage = this.slice(
            //     program,
            //     labelPos[cmd],
            //     labelPos[cmd] + 2
            // );
            // console.logBytes(branchPositionStorage);
            bytes memory programAfter = this.slice(program, labelPos[cmd] + 2, program.length);
            program = bytes.concat(programBefore, bytes2(uint16(_branchLocation)), programAfter);
            // console.logBytes(program);
            // console.logBytes(this.slice(data, _branchLocation, _branchLocation + 2));
        } else {
            program = bytes.concat(program, opcode);

            bytes4 selector = _ctx.asmSelectors(cmd);
            if (selector != 0x0) {
                (bool success, ) = address(this).delegatecall(
                    abi.encodeWithSelector(selector, _ctx)
                );
                require(success, 'Parser: delegatecall to asmSelector failed');
            }
        }
        // if no selector then opcode without params
    }

    // TODO: move to BytesUtils library
    function slice(
        bytes calldata _data,
        uint256 _start,
        uint256 _end
    ) public pure returns (bytes memory) {
        return _data[_start:_end];
    }

    function nextCmd() internal returns (string storage) {
        return cmds[cmdIdx++];
    }

    function parseVariable() internal {
        program = bytes.concat(program, bytes4(keccak256(abi.encodePacked(nextCmd()))));
    }

    function parseBranchOf(IContext _ctx, string memory baseOpName) internal {
        program = bytes.concat(program, _ctx.branchCodes(baseOpName, nextCmd()));
    }

    function parseAddress() internal {
        program = bytes.concat(program, nextCmd().fromHex());
    }
}
