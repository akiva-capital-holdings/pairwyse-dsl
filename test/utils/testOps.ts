// import { Opcodes } from "../../typechain";
// import { TestOp } from "../types";

// export const testLt: TestOp = {
//   opFunc: (opcodes: Opcodes) => opcodes.opLt,
//   testCases: [
//     // 1 < 2 = true
//     {
//       name: "a less than b",
//       value1: 1,
//       value2: 2,
//       result: 1,
//     },
//     // 1 < 1 = false
//     {
//       name: "a the same as b",
//       value1: 1,
//       value2: 1,
//       result: 0,
//     },
//     // 2 < 1 = false
//     {
//       name: "a greater than b",
//       value1: 2,
//       value2: 1,
//       result: 0,
//     },
//   ],
// };

// export const testGt: TestOp = {
//   opFunc: (opcodes: Opcodes) => opcodes.opGt,
//   testCases: [
//     // 2 > 1 = true
//     {
//       name: "a greater than b",
//       value1: 2,
//       value2: 1,
//       result: 1,
//     },
//     // 1 > 1 = false
//     {
//       name: "a the same as b",
//       value1: 1,
//       value2: 1,
//       result: 0,
//     },
//     // 1 > 2 = false
//     {
//       name: "a less than b",
//       value1: 1,
//       value2: 2,
//       result: 0,
//     },
//   ],
// };

// export const testLe: TestOp = {
//   opFunc: (opcodes: Opcodes) => opcodes.opLe,
//   testCases: [
//     // 1 < 2 = true
//     {
//       name: "a less than b",
//       value1: 1,
//       value2: 2,
//       result: 1,
//     },
//     // 1 <= 1 = true
//     {
//       name: "a the same as b",
//       value1: 1,
//       value2: 1,
//       result: 1,
//     },
//     // 2 < 1 = false
//     {
//       name: "a greater than b",
//       value1: 2,
//       value2: 1,
//       result: 0,
//     },
//   ],
// };

// export const testAnd: TestOp = {
//   opFunc: (opcodes: Opcodes) => opcodes.opAnd,
//   testCases: [
//     // 1 && 0 = false
//     {
//       name: "1 && 0 = false",
//       value1: 1,
//       value2: 0,
//       result: 0,
//     },
//     // 1 && 1 = true
//     {
//       name: "1 && 1 = true",
//       value1: 1,
//       value2: 1,
//       result: 1,
//     },
//     // 0 && 1 = false
//     {
//       name: "0 && 1 = false",
//       value1: 0,
//       value2: 1,
//       result: 0,
//     },
//     // 0 && 0 = false
//     {
//       name: "0 && 0 = false",
//       value1: 0,
//       value2: 0,
//       result: 0,
//     },
//     // 3 && 3 = false
//     {
//       name: "3 && 3 = false",
//       value1: 3,
//       value2: 3,
//       result: 1,
//     },
//   ],
// };

// export const testOr: TestOp = {
//   opFunc: (opcodes: Opcodes) => opcodes.opOr,
//   testCases: [
//     // 1 || 0 = true
//     {
//       name: "1 || 0 = true",
//       value1: 1,
//       value2: 0,
//       result: 1,
//     },
//     // 1 || 1 = true
//     {
//       name: "1 || 1 = true",
//       value1: 1,
//       value2: 1,
//       result: 1,
//     },
//     // 0 || 5 = true
//     {
//       name: "0 || 5 = true",
//       value1: 0,
//       value2: 5,
//       result: 1,
//     },
//     // 0 || 0 = false
//     {
//       name: "0 || 0 = false",
//       value1: 0,
//       value2: 0,
//       result: 0,
//     },
//     // 3 || 3 = false
//     {
//       name: "3 || 3 = false",
//       value1: 3,
//       value2: 3,
//       result: 1,
//     },
//   ],
// };
