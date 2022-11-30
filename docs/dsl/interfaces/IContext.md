## IContext

### OpcodeLibNames

```solidity
enum OpcodeLibNames {
  ComparisonOpcodes,
  BranchingOpcodes,
  LogicalOpcodes,
  OtherOpcodes
}
```

### anyone

```solidity
function anyone() external view returns (address)
```

### stack

```solidity
function stack() external view returns (contract Stack)
```

### program

```solidity
function program() external view returns (bytes)
```

### pc

```solidity
function pc() external view returns (uint256)
```

### nextpc

```solidity
function nextpc() external view returns (uint256)
```

### appAddr

```solidity
function appAddr() external view returns (address)
```

### msgSender

```solidity
function msgSender() external view returns (address)
```

### comparisonOpcodes

```solidity
function comparisonOpcodes() external view returns (address)
```

### branchingOpcodes

```solidity
function branchingOpcodes() external view returns (address)
```

### logicalOpcodes

```solidity
function logicalOpcodes() external view returns (address)
```

### otherOpcodes

```solidity
function otherOpcodes() external view returns (address)
```

### msgValue

```solidity
function msgValue() external view returns (uint256)
```

### opCodeByName

```solidity
function opCodeByName(string _name) external view returns (bytes1 _opcode)
```

### selectorByOpcode

```solidity
function selectorByOpcode(bytes1 _opcode) external view returns (bytes4 _selecotor)
```

### opcodeLibNameByOpcode

```solidity
function opcodeLibNameByOpcode(bytes1 _opcode) external view returns (enum IContext.OpcodeLibNames _name)
```

### asmSelectors

```solidity
function asmSelectors(string _name) external view returns (bytes4 _selecotor)
```

### opsPriors

```solidity
function opsPriors(string _name) external view returns (uint256 _priority)
```

### operators

```solidity
function operators(uint256 _index) external view returns (string _operator)
```

### branchSelectors

```solidity
function branchSelectors(string _baseOpName, bytes1 _branchCode) external view returns (bytes4 _selector)
```

### branchCodes

```solidity
function branchCodes(string _baseOpName, string _branchName) external view returns (bytes1 _branchCode)
```

### aliases

```solidity
function aliases(string _alias) external view returns (string _baseCmd)
```

### isStructVar

```solidity
function isStructVar(string _varName) external view returns (bool)
```

### forLoopIterationsRemaining

```solidity
function forLoopIterationsRemaining() external view returns (uint256)
```

### operatorsLen

```solidity
function operatorsLen() external view returns (uint256)
```

### setComparisonOpcodesAddr

```solidity
function setComparisonOpcodesAddr(address _opcodes) external
```

### setBranchingOpcodesAddr

```solidity
function setBranchingOpcodesAddr(address _opcodes) external
```

### setLogicalOpcodesAddr

```solidity
function setLogicalOpcodesAddr(address _opcodes) external
```

### setOtherOpcodesAddr

```solidity
function setOtherOpcodesAddr(address _opcodes) external
```

### setProgram

```solidity
function setProgram(bytes _data) external
```

### programAt

```solidity
function programAt(uint256 _index, uint256 _step) external view returns (bytes)
```

### programSlice

```solidity
function programSlice(bytes _payload, uint256 _index, uint256 _step) external view returns (bytes)
```

### setPc

```solidity
function setPc(uint256 _pc) external
```

### setNextPc

```solidity
function setNextPc(uint256 _nextpc) external
```

### incPc

```solidity
function incPc(uint256 _val) external
```

### setAppAddress

```solidity
function setAppAddress(address _addr) external
```

### setMsgSender

```solidity
function setMsgSender(address _msgSender) external
```

### setMsgValue

```solidity
function setMsgValue(uint256 _msgValue) external
```

### setStructVars

```solidity
function setStructVars(string _structName, string _varName, string _fullName) external
```

### structParams

```solidity
function structParams(bytes4 _structName, bytes4 _varName) external view returns (bytes4 _fullName)
```

### setForLoopIterationsRemaining

```solidity
function setForLoopIterationsRemaining(uint256 _forLoopIterationsRemaining) external
```

