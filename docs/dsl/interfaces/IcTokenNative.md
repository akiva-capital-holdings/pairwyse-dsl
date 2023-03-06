## IcTokenNative

_Interface of the cToken that defined as asset in https://v2-app.compound.finance/
check if here https://etherscan.io/address/0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5#readContract_

### mint

```solidity
function mint() external payable
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external returns (uint256)
```

Sender redeems cTokens in exchange for a specified amount of underlying asset

_Accrues interest whether or not the operation succeeds, unless reverted_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| redeemAmount | uint256 | The amount of underlying to redeem |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | uint 0=success, otherwise a failure (see ErrorReporter.sol for details) |

