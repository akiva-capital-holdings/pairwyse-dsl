## LogicalOpcodes

Opcodes for set operators such as AND, OR, XOR

### opAnd

```solidity
function opAnd(address _ctx) public
```

_Compares two values in the stack. Put 1 if both of them are 1, put
     0 otherwise_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opOr

```solidity
function opOr(address _ctx) public
```

_Compares two values in the stack. Put 1 if either one of them is 1,
     put 0 otherwise_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opXor

```solidity
function opXor(address _ctx) public
```

_Compares two values in the stack. Put 1 if the values ​
​are different and 0 if they are the same_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opAdd

```solidity
function opAdd(address _ctx) public
```

_Add two values and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opSub

```solidity
function opSub(address _ctx) public
```

_Subtracts one value from enother and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opMul

```solidity
function opMul(address _ctx) public
```

_Multiplies values and put result in the stack._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context contract address |

### opDiv

```solidity
function opDiv(address _ctx) public
```

Divide two numbers from the top of the stack

_This is an integer division. Example: 5 / 2 = 2_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _ctx | address | Context address |

