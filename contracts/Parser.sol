// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { Opcodes } from './libs/Opcodes.sol';
import { Storage } from './helpers/Storage.sol';
import { Preprocessor } from './Preprocessor.sol';
import 'hardhat/console.sol';

// TODO: make all quotes single

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
        string[] memory _code = preprocessor.transform(_codeRaw);
        parseCode(_ctx, _code);
    }

    function initOpcodes(IContext _ctx) external {
        // Opcodes for operators
        addOpcodeForOperator(_ctx, '!', 0x02, Opcodes.opNot.selector, 0x0, 4);

        addOpcodeForOperator(_ctx, 'swap', 0x05, Opcodes.opSwap.selector, 0x0, 3);
        addOpcodeForOperator(_ctx, 'and', 0x12, Opcodes.opAnd.selector, 0x0, 3);

        addOpcodeForOperator(_ctx, 'xor', 0x11, Opcodes.opXor.selector, 0x0, 2);
        addOpcodeForOperator(_ctx, 'or', 0x13, Opcodes.opOr.selector, 0x0, 2);

        addOpcodeForOperator(_ctx, '==', 0x01, Opcodes.opEq.selector, 0x0, 1);
        addOpcodeForOperator(_ctx, '<', 0x03, Opcodes.opLt.selector, 0x0, 1);
        addOpcodeForOperator(_ctx, '>', 0x04, Opcodes.opGt.selector, 0x0, 1);
        addOpcodeForOperator(_ctx, '<=', 0x06, Opcodes.opLe.selector, 0x0, 1);
        addOpcodeForOperator(_ctx, '>=', 0x07, Opcodes.opGe.selector, 0x0, 1);
        addOpcodeForOperator(_ctx, '!=', 0x14, Opcodes.opNotEq.selector, 0x0, 1);

        // Simple Opcodes
        _ctx.addOpcode('blockNumber', 0x15, Opcodes.opBlockNumber.selector, 0x0);
        _ctx.addOpcode('blockTimestamp', 0x16, Opcodes.opBlockTimestamp.selector, 0x0);
        _ctx.addOpcode('blockChainId', 0x17, Opcodes.opBlockChainId.selector, 0x0);
        _ctx.addOpcode('bool', 0x18, Opcodes.opBool.selector, this.asmBool.selector);
        _ctx.addOpcode('uint256', 0x1a, Opcodes.opUint256.selector, this.asmUint256.selector);
        _ctx.addOpcode('msgSender', 0x1d, Opcodes.opMsgSender.selector, 0x0);
        _ctx.addOpcode('sendEth', 0x1e, Opcodes.opSendEth.selector, this.asmSend.selector);
        _ctx.addOpcode('transfer', 0x1f, Opcodes.opTransfer.selector, this.asmTransfer.selector);
        _ctx.addOpcode(
            'transferFrom',
            0x20,
            Opcodes.opTransferFrom.selector,
            this.asmTransferFrom.selector
        );
        _ctx.addOpcode(
            'setLocalBool',
            0x21,
            Opcodes.opSetLocalBool.selector,
            this.asmSetLocalBool.selector
        );
        _ctx.addOpcode('msgValue', 0x22, Opcodes.opMsgValue.selector, 0x0);

        // Complex Opcodes with sub Opcodes (branches)
        string memory name = 'loadLocal';
        _ctx.addOpcode(name, 0x1b, Opcodes.opLoadLocalAny.selector, this.asmLoadLocal.selector);
        _ctx.addOpcodeBranch(name, 'uint256', 0x01, Opcodes.opLoadLocalUint256.selector);
        _ctx.addOpcodeBranch(name, 'bool', 0x02, Opcodes.opLoadLocalBool.selector);
        _ctx.addOpcodeBranch(name, 'address', 0x03, Opcodes.opLoadLocalAddress.selector);
        _ctx.addOpcodeBranch(name, 'bytes32', 0x04, Opcodes.opLoadLocalBytes32.selector);

        name = 'loadRemote';
        _ctx.addOpcode(name, 0x1c, Opcodes.opLoadRemoteAny.selector, this.asmLoadRemote.selector);
        _ctx.addOpcodeBranch(name, 'uint256', 0x01, Opcodes.opLoadRemoteUint256.selector);
        _ctx.addOpcodeBranch(name, 'bool', 0x02, Opcodes.opLoadRemoteBool.selector);
        _ctx.addOpcodeBranch(name, 'address', 0x03, Opcodes.opLoadRemoteAddress.selector);
        _ctx.addOpcodeBranch(name, 'bytes32', 0x04, Opcodes.opLoadRemoteBytes32.selector);
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
        // Note: this function may cost many gas. But the contract that will execute sendEth function will need to have
        // that ETH. So one solution is to transfer ETH to Opcodes contract (that executes sendEth function) or to move
        // all execution (and evaluation logic) of sendEth function to Parser contract (that is less desirable)
        // transferAllEth(payable(address(opcodes)));
    }

    function asmTransfer() public {
        // address token = getAddress();
        // console.log("token");
        // console.log(token);
        parseAddress();
        parseVariable();
        asmUint256();
        // transferAllERC20(token, address(opcodes));
    }

    function asmTransferFrom() public {
        // address token = getAddress();
        // console.log("token");
        // console.log(token);
        // parseAddress();
        parseVariable();
        parseVariable();
        parseVariable();
        asmUint256();
    }

    /**
     * Internal functions
     */

    function addOpcodeForOperator(
        IContext _ctx,
        string memory _name,
        bytes1 _opcode,
        bytes4 _opSelector,
        bytes4 _asmSelector,
        uint256 _priority
    ) internal {
        _ctx.addOpcode(_name, _opcode, _opSelector, _asmSelector);
        preprocessor.addOperator(_name, _priority);
    }

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
        require(opcode != 0x0, string(abi.encodePacked("Parser: '", cmd, "' command is unknown")));
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
