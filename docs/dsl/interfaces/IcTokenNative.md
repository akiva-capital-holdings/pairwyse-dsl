## IcTokenNative

_Interface of the cToken that defined as asset in https://v2-app.compound.finance/
check if here https://etherscan.io/address/0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5#readContract_

### mint

```solidity
function mint() external payable
```

Sender supplies assets into the market and receives cTokens in exchange

_Accrues interest whether or not the operation succeeds, unless reverted_

