## IParser

### ExecRes

```solidity
event ExecRes(bool result)
```

### NewConditionalTx

```solidity
event NewConditionalTx(address txObj)
```

### parse

```solidity
function parse(address _preprAddr, address _dslCtxAddr, address _programCtxAddr, string _codeRaw) external
```

### parseCode

```solidity
function parseCode(address _dslCtxAddr, address _programCtxAddr, string[] _code) external
```

### asmSetLocalBool

```solidity
function asmSetLocalBool(bytes _program) external returns (bytes newProgram)
```

### asmSetUint256

```solidity
function asmSetUint256(bytes _program) external returns (bytes newProgram)
```

### asmVar

```solidity
function asmVar(bytes _program) external returns (bytes newProgram)
```

### asmLoadRemote

```solidity
function asmLoadRemote(bytes _program, address _ctxAddr) external returns (bytes newProgram)
```

### asmDeclare

```solidity
function asmDeclare(bytes _program, address _ctxAddr) external returns (bytes newProgram)
```

### asmBool

```solidity
function asmBool(bytes _program) external returns (bytes newProgram)
```

### asmUint256

```solidity
function asmUint256(bytes _program) external returns (bytes newProgram)
```

### asmSend

```solidity
function asmSend(bytes _program) external returns (bytes newProgram)
```

### asmTransfer

```solidity
function asmTransfer(bytes _program) external returns (bytes newProgram)
```

### asmTransferVar

```solidity
function asmTransferVar(bytes _program) external returns (bytes newProgram)
```

### asmTransferFrom

```solidity
function asmTransferFrom(bytes _program) external returns (bytes newProgram)
```

### asmBalanceOf

```solidity
function asmBalanceOf(bytes _program) external returns (bytes newProgram)
```

### asmLengthOf

```solidity
function asmLengthOf(bytes _program) external returns (bytes newProgram)
```

### asmSumOf

```solidity
function asmSumOf(bytes _program) external returns (bytes newProgram)
```

### asmSumThroughStructs

```solidity
function asmSumThroughStructs(bytes _program) external returns (bytes newProgram)
```

### asmTransferFromVar

```solidity
function asmTransferFromVar(bytes _program) external returns (bytes newProgram)
```

### asmIfelse

```solidity
function asmIfelse(address _programCtxAddr, bytes _program) external returns (bytes newProgram)
```

### asmIf

```solidity
function asmIf(address _programCtxAddr, bytes _program) external returns (bytes newProgram)
```

### asmFunc

```solidity
function asmFunc(address _programCtxAddr, bytes _program) external returns (bytes newProgram)
```

### asmGet

```solidity
function asmGet(bytes _program) external returns (bytes newProgram)
```

### asmPush

```solidity
function asmPush(bytes _program) external returns (bytes newProgram)
```

### asmStruct

```solidity
function asmStruct(bytes _program, address _ctxAddr) external returns (bytes newProgram)
```

### asmForLoop

```solidity
function asmForLoop(bytes _program) external returns (bytes newProgram)
```

### asmEnableRecord

```solidity
function asmEnableRecord(bytes _program) external returns (bytes newProgram)
```

