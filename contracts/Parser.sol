// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { StringUtils } from './libs/StringUtils.sol';
// import { ComparatorOpcodes } from './libs/opcodes/ComparatorOpcodes.sol';
// import { LogicalOpcodes } from './libs/opcodes/LogicalOpcodes.sol';
// import { SetOpcodes } from './libs/opcodes/SetOpcodes.sol';
// import { OtherOpcodes } from './libs/opcodes/OtherOpcodes.sol';
import { Storage } from './helpers/Storage.sol';
import { Preprocessor } from './Preprocessor.sol';

import 'hardhat/console.sol';

contract Parser is IParser, Storage {
    using StringUtils for string;

    Preprocessor public preprocessor;

    bytes internal program;
    string[] internal cmds;
    uint256 internal cmdIdx;

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

    /**
     * Internal functions
     */

    function parseCode(IContext _ctx, string[] memory code) internal virtual {
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
        require(opcode != 0x0, string(abi.encodePacked('Parser: "', cmd, '" command is unknown')));
        program = bytes.concat(program, opcode);

        bytes4 selector = _ctx.asmSelectors(cmd);
        if (selector != 0x0) {
            (bool success, ) = address(this).delegatecall(abi.encodeWithSelector(selector, _ctx));
            require(success, 'Parser: delegatecall to asmSelector failed');
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

    function getAddress() internal view returns (address) {
        bytes memory addrBytes = cmds[cmdIdx].fromHex();
        bytes32 addrB32;
        // console.logBytes(addrBytes);

        assembly {
            addrB32 := mload(add(addrBytes, 0x20))
        }
        /**
         * Shift bytes to the left so that
         * 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512000000000000000000000000
         * transforms into
         * 0x000000000000000000000000e7f1725e7734ce288f8367e1bb143e90bb3f0512
         * This is needed to later conversion from bytes32 to address
         */
        addrB32 >>= 96;

        // console.log("addrB32");
        // console.logBytes32(addrB32);

        return address(uint160(uint256(addrB32)));
    }
}
