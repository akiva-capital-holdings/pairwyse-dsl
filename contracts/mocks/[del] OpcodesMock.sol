// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.0;

// import { IContext } from '../interfaces/IContext.sol';
// import { IStorage } from '../interfaces/IStorage.sol';
// import { IERC20 } from '../interfaces/IERC20.sol';
// import { Opcodes } from '../libs/Opcodes.sol';
// import { StackValue } from '../helpers/Stack.sol';
// import 'hardhat/console.sol';

// contract OpcodesMock {
//     function opLoadLocalAny(IContext _ctx) public {
//         // Opcodes.opLoadLocalAny(_ctx); // todo: uncomment
//     }

//     function opLoadRemoteAny(IContext _ctx) public {
//         // Opcodes.opLoadRemoteAny(_ctx); // todo: uncomment
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 to the stack if they are equal.
//      */
//     function opEq(IContext _ctx) public {
//         Opcodes.opEq(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 to the stack if they are not equal.
//      */
//     function opNotEq(IContext _ctx) public {
//         Opcodes.opNotEq(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 to the stack if value1 < value2
//      */
//     function opLt(IContext _ctx) public {
//         Opcodes.opLt(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 to the stack if value1 > value2
//      */
//     function opGt(IContext _ctx) public {
//         Opcodes.opGt(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 to the stack if value1 <= value2
//      */
//     function opLe(IContext _ctx) public {
//         Opcodes.opLe(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 to the stack if value1 >= value2
//      */
//     function opGe(IContext _ctx) public {
//         Opcodes.opGe(_ctx);
//     }

//     /**
//      * @dev Swaps two last element in the stack
//      */
//     function opSwap(IContext _ctx) public {
//         Opcodes.opSwap(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 if both of them are 1, put
//      *      0 otherwise
//      */
//     function opAnd(IContext _ctx) public {
//         Opcodes.opAnd(_ctx);
//     }

//     /**
//      * @dev Compares two values in the stack. Put 1 if either one of them is 1,
//      *      put 0 otherwise
//      */
//     function opOr(IContext _ctx) public {
//         Opcodes.opOr(_ctx);
//     }

//     function opXor(IContext _ctx) public {
//         Opcodes.opXor(_ctx);
//     }

//     /**
//      * @dev Revert last value in the stack
//      */
//     function opNot(IContext _ctx) public {
//         Opcodes.opNot(_ctx);
//     }

//     function opBlockNumber(IContext _ctx) public {
//         Opcodes.opBlockNumber(_ctx);
//     }

//     function opBlockTimestamp(IContext _ctx) public {
//         Opcodes.opBlockTimestamp(_ctx);
//     }

//     function opBlockChainId(IContext _ctx) public {
//         Opcodes.opBlockChainId(_ctx);
//     }

//     function opMsgSender(IContext _ctx) public {
//         Opcodes.opMsgSender(_ctx);
//     }

//     function opLoadLocalUint256(IContext _ctx) public {
//         // Opcodes.opLoadLocalUint256(_ctx); // todo: uncomment
//     }

//     function opLoadLocalBytes32(IContext _ctx) public {
//         // Opcodes.opLoadLocalBytes32(_ctx); // todo: uncomment
//     }

//     function opLoadLocalBool(IContext _ctx) public {
//         // Opcodes.opLoadLocalBool(_ctx); // todo: uncomment
//     }

//     function opLoadLocalAddress(IContext _ctx) public {
//         // Opcodes.opLoadLocalAddress(_ctx); // todo: uncomment
//     }

//     function opLoadRemoteUint256(IContext _ctx) public {
//         // Opcodes.opLoadRemoteUint256(_ctx); // todo: uncomment
//     }

//     function opLoadRemoteBytes32(IContext _ctx) public {
//         // Opcodes.opLoadRemoteBytes32(_ctx); // todo: uncomment
//     }

//     function opLoadRemoteBool(IContext _ctx) public {
//         // Opcodes.opLoadRemoteBool(_ctx); // todo: uncomment
//     }

//     function opLoadRemoteAddress(IContext _ctx) public {
//         // Opcodes.opLoadRemoteAddress(_ctx); // todo: uncomment
//     }

//     function opBool(IContext _ctx) public {
//         Opcodes.opBool(_ctx);
//     }

//     function opUint256(IContext _ctx) public {
//         Opcodes.opUint256(_ctx);
//     }

//     function opSendEth(IContext _ctx) public {
//         Opcodes.opSendEth(_ctx);
//     }

//     function opTransfer(IContext _ctx) public {
//         Opcodes.opTransfer(_ctx);
//     }

//     function opTransferFrom(IContext _ctx) public {
//         Opcodes.opTransferFrom(_ctx);
//     }

//     // function opUint256Get(IContext _ctx) private returns (uint256) {}

//     // function putUint256ToStack(IContext _ctx, uint256 result) private {}

//     // function nextBytes(IContext _ctx, uint256 size) private returns (bytes memory out) {}

//     // function nextBytes1(IContext _ctx) private returns (bytes1) {}

//     // function nextBranchSelector(IContext _ctx, string memory baseOpName) private returns (bytes4) {}

//     function mustCall(address addr, bytes memory data) public {
//         Opcodes.mustCall(addr, data);
//     }

//     function opLoadLocalGet(IContext _ctx, string memory funcSignature)
//         public
//         returns (bytes32 result)
//     {
//         // return Opcodes.opLoadLocalGet(_ctx, funcSignature); // todo: uncomment
//     }

//     // function opAddressGet(IContext _ctx) private returns (address) {}

//     // function opLoadLocal(IContext _ctx, string memory funcSignature) private {}

//     function opLoadRemote(IContext _ctx, string memory funcSignature) public {
//         // Opcodes.opLoadRemote(_ctx, funcSignature); // todo: uncomment
//     }
// }
