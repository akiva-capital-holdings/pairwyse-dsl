// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import { IERC20 } from './interfaces/IERC20.sol';
import { IContext } from './interfaces/IContext.sol';
import { IParser } from './interfaces/IParser.sol';
import { StringUtils } from './libs/StringUtils.sol';
import { ComparatorOpcodes } from './libs/opcodes/ComparatorOpcodes.sol';
import { LogicalOpcodes } from './libs/opcodes/LogicalOpcodes.sol';
import { SetOpcodes } from './libs/opcodes/SetOpcodes.sol';
import { OtherOpcodes } from './libs/opcodes/OtherOpcodes.sol';
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
        addOpcodeForOperator(
            _ctx,
            '==',
            0x01,
            ComparatorOpcodes.opEq.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            _ctx,
            '!=',
            0x14,
            ComparatorOpcodes.opNotEq.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            _ctx,
            '<',
            0x03,
            ComparatorOpcodes.opLt.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            _ctx,
            '>',
            0x04,
            ComparatorOpcodes.opGt.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            _ctx,
            '<=',
            0x06,
            ComparatorOpcodes.opLe.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            _ctx,
            '>=',
            0x07,
            ComparatorOpcodes.opGe.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            1
        );
        addOpcodeForOperator(
            _ctx,
            'swap',
            0x05,
            ComparatorOpcodes.opSwap.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            3
        );
        addOpcodeForOperator(
            _ctx,
            '!',
            0x02,
            ComparatorOpcodes.opNot.selector,
            0x0,
            IContext.OpcodeLibNames.ComparatorOpcodes,
            4
        );

        addOpcodeForOperator(
            _ctx,
            'and',
            0x12,
            SetOpcodes.opAnd.selector,
            0x0,
            IContext.OpcodeLibNames.SetOpcodes,
            3
        );
        addOpcodeForOperator(
            _ctx,
            'xor',
            0x11,
            SetOpcodes.opXor.selector,
            0x0,
            IContext.OpcodeLibNames.SetOpcodes,
            2
        );
        addOpcodeForOperator(
            _ctx,
            'or',
            0x13,
            SetOpcodes.opOr.selector,
            0x0,
            IContext.OpcodeLibNames.SetOpcodes,
            2
        );

        // Branching (bnz = branch non-zero)
        _ctx.addOpcode(
            'bnz',
            0x23,
            LogicalOpcodes.opBnz.selector,
            0x0,
            IContext.OpcodeLibNames.LogicalOpcodes
        );
        _ctx.addOpcode(
            'end',
            0x24,
            LogicalOpcodes.opEnd.selector,
            0x0,
            IContext.OpcodeLibNames.LogicalOpcodes
        );

        // Simple Opcodes
        _ctx.addOpcode(
            'blockNumber',
            0x15,
            OtherOpcodes.opBlockNumber.selector,
            0x0,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'blockTimestamp',
            0x16,
            OtherOpcodes.opBlockTimestamp.selector,
            0x0,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'blockChainId',
            0x17,
            OtherOpcodes.opBlockChainId.selector,
            0x0,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'bool',
            0x18,
            OtherOpcodes.opBool.selector,
            this.asmBool.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'uint256',
            0x1a,
            OtherOpcodes.opUint256.selector,
            this.asmUint256.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'msgSender',
            0x1d,
            OtherOpcodes.opMsgSender.selector,
            0x0,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'sendEth',
            0x1e,
            OtherOpcodes.opSendEth.selector,
            this.asmSend.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'transfer',
            0x1f,
            OtherOpcodes.opTransfer.selector,
            this.asmTransfer.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'transferFrom',
            0x20,
            OtherOpcodes.opTransferFrom.selector,
            this.asmTransferFrom.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'setLocalBool',
            0x21,
            OtherOpcodes.opSetLocalBool.selector,
            this.asmSetLocalBool.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcode(
            'msgValue',
            0x22,
            OtherOpcodes.opMsgValue.selector,
            0x0,
            IContext.OpcodeLibNames.OtherOpcodes
        );

        // Complex Opcodes with sub Opcodes (branches)
        string memory name = 'loadLocal';
        _ctx.addOpcode(
            name,
            0x1b,
            OtherOpcodes.opLoadLocalAny.selector,
            this.asmLoadLocal.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadLocalUint256.selector);
        _ctx.addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadLocalBool.selector);
        _ctx.addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadLocalAddress.selector);
        _ctx.addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadLocalBytes32.selector);

        name = 'loadRemote';
        _ctx.addOpcode(
            name,
            0x1c,
            OtherOpcodes.opLoadRemoteAny.selector,
            this.asmLoadRemote.selector,
            IContext.OpcodeLibNames.OtherOpcodes
        );
        _ctx.addOpcodeBranch(name, 'uint256', 0x01, OtherOpcodes.opLoadRemoteUint256.selector);
        _ctx.addOpcodeBranch(name, 'bool', 0x02, OtherOpcodes.opLoadRemoteBool.selector);
        _ctx.addOpcodeBranch(name, 'address', 0x03, OtherOpcodes.opLoadRemoteAddress.selector);
        _ctx.addOpcodeBranch(name, 'bytes32', 0x04, OtherOpcodes.opLoadRemoteBytes32.selector);
    }

    // function initComparatorOpcodes(IContext _ctx) public {}

    // function initLogicalOpcodes(IContext _ctx) public {}

    // function initSetOpcodes(IContext _ctx) public {}

    // function initOtherOpcodes(IContext _ctx) public {}

    // function initOtherOpcodes(IContext _ctx) public {}

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
        IContext.OpcodeLibNames _libName,
        uint256 _priority
    ) internal {
        _ctx.addOpcode(_name, _opcode, _opSelector, _asmSelector, _libName);
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
