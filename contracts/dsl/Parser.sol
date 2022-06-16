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

contract Parser is IParser, Storage {
    using StringUtils for string;
    using ByteUtils for bytes;

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

    // setLocalUint256 VARNAME 12345
    function asmSetLocalUint256() public {
        parseVariable();
        asmUint256();
    }

    // (uint256 5 + uint256 7) setUint256 VARNAME
    function asmSetUint256() public {
        parseVariable();
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
        parseVariable(); // token address
        parseVariable(); // receiver
        asmUint256(); // amount
    }

    function asmTransferVar() public {
        parseVariable(); // token address
        parseVariable(); // receiver
        parseVariable(); // amount
    }

    function asmTransferFrom() public {
        parseVariable(); // token address
        parseVariable(); // from
        parseVariable(); // to
        asmUint256(); // amount
    }

    function asmTransferFromVar() public {
        parseVariable(); // token address
        parseVariable(); // from
        parseVariable(); // to
        parseVariable(); // amount
    }

    function asmBalanceOf() public {
        parseVariable(); // token address
        parseVariable(); // user address
    }

    function asmIfelse() public {
        string memory _true = nextCmd(); // "positive" branch name
        string memory _false = nextCmd(); // "negative" branch name

        labelPos[_true] = program.length; // `positive` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `positive` branch offset

        labelPos[_false] = program.length; // `negative` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `negative` branch offset

        // console.logBytes(program);
    }

    function asmIf() public {
        labelPos[nextCmd()] = program.length; // `true` branch position
        program = bytes.concat(program, bytes2(0)); // placeholder for `true` branch offset
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

        // console.logBytes(program);
        _ctx.setProgram(program);
    }

    function parseOpcodeWithParams(IContext _ctx) internal {
        string storage cmd = nextCmd();
        bytes1 opcode = _ctx.opCodeByName(cmd);
        require(
            opcode != 0x0 || isLabel(cmd),
            string(abi.encodePacked('Parser: "', cmd, '" command is unknown'))
        );
        if (isLabel(cmd)) {
            uint256 _branchLocation = program.length;
            bytes memory programBefore = program.slice(0, labelPos[cmd]);
            bytes memory programAfter = program.slice(labelPos[cmd] + 2, program.length);
            program = bytes.concat(programBefore, bytes2(uint16(_branchLocation)), programAfter);
        } else {
            program = bytes.concat(program, opcode);

            bytes4 _selector = _ctx.asmSelectors(cmd);
            if (_selector != 0x0) {
                (bool success,)= address(this).delegatecall(
                    abi.encodeWithSelector(_selector, _ctx)
                );
                require(success, 'Parser: delegatecall to asmSelector failed');
            }
        }
        // if no selector then opcode without params
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
