## ContextMock

### addOpcode

```solidity
function addOpcode(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName, uint8 _numOfArgs, bool _isCommand) external
```

### addOpcodeBranchExt

```solidity
function addOpcodeBranchExt(string _baseOpName, string _branchName, bytes1 _branchCode, bytes4 _selector) external
```

### addOperatorExt

```solidity
function addOperatorExt(string _op, uint256 _priority) external
```

### addOpcodeForOperatorExt

```solidity
function addOpcodeForOperatorExt(string _name, bytes1 _opcode, bytes4 _opSelector, bytes4 _asmSelector, enum IContext.OpcodeLibNames _libName, uint256 _priority) external
```

