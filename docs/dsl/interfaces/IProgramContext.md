## IProgramContext

### ANYONE

```solidity
function ANYONE() external view returns (address)
```

### stack

```solidity
function stack() external view returns (contract Stack)
```

### program

```solidity
function program() external view returns (bytes)
```

### currentProgram

```solidity
function currentProgram() external view returns (bytes)
```

### programAt

```solidity
function programAt(uint256 _start, uint256 _size) external view returns (bytes)
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

### msgValue

```solidity
function msgValue() external view returns (uint256)
```

### isStructVar

```solidity
function isStructVar(string _varName) external view returns (bool)
```

### labelPos

```solidity
function labelPos(string _name) external view returns (uint256)
```

### setLabelPos

```solidity
function setLabelPos(string _name, uint256 _value) external
```

### forLoopIterationsRemaining

```solidity
function forLoopIterationsRemaining() external view returns (uint256)
```

### setProgram

```solidity
function setProgram(bytes _data) external
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

