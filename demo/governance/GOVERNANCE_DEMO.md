# Governance Demo

## Prerequisites
To setup Governance Demo use the same steps as in [Front End Demo V2](https://github.com/akiva-capital-holdings/solidity-dsl/blob/master/demo/v2/FE-demo-v2.md). Specifically read the following sections:
* Setup Solidity SC
* Setup FE
* Setup Metamask
* Reset MetaMask nonce (needed for localhost)

However, please use the following commit IDs (insted of those, provided in Front End Demo V2):
* Pairwyse DSL: [8a0b6923f89dba700e9587507649ee9e8e850a98](https://github.com/akiva-capital-holdings/solidity-dsl/commit/8a0b6923f89dba700e9587507649ee9e8e850a98)
* Front End: [acb223214b4be906e4b694aab0b54d3fe5c010fc](https://github.com/akiva-capital-holdings/dsl-fe/commit/acb223214b4be906e4b694aab0b54d3fe5c010fc)

## Steps

1. **Solidity.** Run the hardhat node via `npx hardhat node` command. Keep it running in the separate terminal window.
2. **Solidity.** Deploy contracts to localhost, copy & paste their addresses on Front End, replace agreement bytecode on Front End.

```
npx hardhat run scripts/deploy.demoV2.ts --network localhost
```

3. **Front End.** Run Front End with `yarn start:local`
4. **MetaMask.** Reset account nonce.
5. **Front End.** Deploy Agreement via Front End. Save the deployed contract address somewhere for the later use.
6. **Front End.** Set variable `BOB` with value `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
7. **MetaMask.** Top up Agreement contract with 1 ETH.

   ```
   npx hardhat top-up:agreement \
      --network localhost \
      --agreement <deployed Agreement address> \
      --amount 1
   ```

8. **Solidity.** Deploy Governance contract which will be the owner of the Agreement that you've deployed earlier. For that use the following command:

```
  npx hardhat deploy:governance \
    --network localhost \
    --agreement <deployed Agreement address> \
    --owner <your address from which you're deploying (like Alice's address)>
```

Save the command output somewhere for later use.

8. **Solidity.** Setup Governance contract

   ```
   npx hardhat setup:governance \
      --network localhost \
      --parser <deployed Parser address> \
      --preprocessor <deployed Preprocessor address> \
      --governance <deployed Governance address>
   ```

9. **Solidity.** Change Agreement ownership to Governance contract address.

   ```
   npx hardhat transfer-ownership:agreement \
      --network localhost \
      --agreement <deployed Agreement address> \
      --new-owner <Governance contract address>
   ```

10. **Front End.** Setup a new record in Agreement
    RecordId: `123`
    Signatories: `0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266`
    Conditions: [`bool true`]
    Transaction: `sendEth BOB 1e18`

11. **Front End.** Set variables in Governance contract

    - Set address `AGREEMENT_ADDR` to <deployed Agreement address>
    - Set number `RECORD_ID` = `123`
    - Set number `DEADLINE` to the output of `npx hardhat get-next-month-timestamp --network localhost`

12. **Front End.** Vote using Governance contract.

    - From Alice's address execute record number `1` (vote yes)
    - From Bob's address execute record number `1` (vote yes)
    - From Carl's address execute record number `2` (vote no)

13. **Solidity.** Increase EVM time

```
npx hardhat advance-time \
   --by 2592000 \
   --network localhost
```

13. **Front End.** Execute the Governance record number `3` to calculate the voting results
14. **Front End.** Execute the Agreement record number `123` to transfer 1 ETH to `BOB`
15. **Metamask.** Check that Bobs balance has changed
