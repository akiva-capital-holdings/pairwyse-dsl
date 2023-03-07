## OtherOpcodes

### opBlockNumber

```solidity
function opBlockNumber(address _ctxProgram, address) public
```

### opBlockTimestamp

```solidity
function opBlockTimestamp(address _ctxProgram, address) public
```

### opBlockChainId

```solidity
function opBlockChainId(address _ctxProgram, address) public
```

### opMsgSender

```solidity
function opMsgSender(address _ctxProgram, address) public
```

### opMsgValue

```solidity
function opMsgValue(address _ctxProgram, address) public
```

### opSetLocalBool

```solidity
function opSetLocalBool(address _ctxProgram, address) public
```

_Sets boolean variable in the application contract.
The value of bool variable is taken from DSL code itself_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opSetUint256

```solidity
function opSetUint256(address _ctxProgram, address) public
```

_Sets uint256 variable in the application contract. The value of the variable is taken from stack_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opLoadLocalUint256

```solidity
function opLoadLocalUint256(address _ctxProgram, address) public
```

### opLoadLocalAddress

```solidity
function opLoadLocalAddress(address _ctxProgram, address) public
```

### opBool

```solidity
function opBool(address _ctxProgram, address) public
```

### opUint256

```solidity
function opUint256(address _ctxProgram, address) public
```

### opSendEth

```solidity
function opSendEth(address _ctxProgram, address) public
```

### opTransfer

```solidity
function opTransfer(address _ctxProgram, address) public
```

_Calls IER20 transfer() function and puts to stack `1`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctxProgram | address | ProgramContext contract address |
|  | address |  |

### opTransferVar

```solidity
function opTransferVar(address _ctxProgram, address) public
```

### opTransferFrom

```solidity
function opTransferFrom(address _ctxProgram, address) public
```

### opTransferFromVar

```solidity
function opTransferFromVar(address _ctxProgram, address) public
```

### opBalanceOf

```solidity
function opBalanceOf(address _ctxProgram, address) public
```

### opAllowance

```solidity
function opAllowance(address _ctxProgram, address) public
```

### opMint

```solidity
function opMint(address _ctxProgram, address) public
```

### opBurn

```solidity
function opBurn(address _ctxProgram, address) public
```

### opAddressGet

```solidity
function opAddressGet(address _ctxProgram, address) public returns (address)
```

### opLoadLocal

```solidity
function opLoadLocal(address _ctxProgram, string funcSignature) public
```

### opEnableRecord

```solidity
function opEnableRecord(address _ctxProgram, address) public
```

