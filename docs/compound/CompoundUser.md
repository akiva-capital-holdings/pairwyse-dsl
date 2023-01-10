## CompoundUser

_The contract that integrates with compounds and stores cTokens
check https://v2-app.compound.finance/ for more information
Note: Ethereum network_

### compounds

```solidity
mapping(address => address) compounds
```

### info

```solidity
mapping(address => mapping(address => uint256)) info
```

### constructor

```solidity
constructor() public
```

_Sets used tokens as underlying for cTokens_

### receive

```solidity
receive() external payable
```

### mint

```solidity
function mint(address _token, uint256 _amount) external
```

_Supply chosen token into the market_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | the address of simple token that will be supply as asset |
| _amount | uint256 | the amount of the underlying asset to supply |

### redeem

```solidity
function redeem(address _token) external
```

_Sender redeems all his cTokens in exchange for the underlying asset_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _token | address | the address of simple token that will be supply as asset |

