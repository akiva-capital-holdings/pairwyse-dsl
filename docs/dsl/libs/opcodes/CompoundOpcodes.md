## CompoundOpcodes

### opCompound

```solidity
function opCompound(address _ctxProgram, address _ctxDSL) public
```

_Master opcode to interact with Compound V2. Needs sub-commands to be executed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSLContext contract address |

### opCompoundDeposit

```solidity
function opCompoundDeposit(address _ctxProgram, address) public
```

Sub-command of Compound V2. Makes a deposit tokens to Compound V2

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompoundDepositNative

```solidity
function opCompoundDepositNative(address _ctxProgram, address) public
```

Sub-command of Compound V2. Makes a deposit funds to Compound V2
for native coin

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompoundWithdrawMax

```solidity
function opCompoundWithdrawMax(address _ctxProgram, address) public
```

Sub-command of Compound V2. Makes a withdrawal of all funds to Compound V2

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompoundWithdraw

```solidity
function opCompoundWithdraw(address _ctxProgram, address) public
```

Sub-command of Compound V2. Makes a withdrawal funds to Compound V2

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompoundBorrowMax

```solidity
function opCompoundBorrowMax(address _ctxProgram, address) public
```

TODO: might need to be removed
Sub-command of Compound V2. Makes a barrow of all USDC on cUSDC

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompoundBorrow

```solidity
function opCompoundBorrow(address _ctxProgram, address) public
```

Sub-command of Compound V2. Makes a borrow from market

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opCompoundRepayNativeMax

```solidity
function opCompoundRepayNativeMax(address _ctxProgram, address) public
```

### opCompoundRepayNative

```solidity
function opCompoundRepayNative(address _ctxProgram, address) public
```

### opCompoundRepayMax

```solidity
function opCompoundRepayMax(address _ctxProgram, address) public
```

### opCompoundRepay

```solidity
function opCompoundRepay(address _ctxProgram, address) public
```

### _mustDelegateCall

```solidity
function _mustDelegateCall(address _ctxProgram, address _ctxDSL, string _opcode) internal
```

_Makes a delegate call and ensures it is successful_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
| _ctxDSL | address | DSLContext contract address |
| _opcode | string | Opcode string |


