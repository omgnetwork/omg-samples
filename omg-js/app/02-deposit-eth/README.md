# Deposit ETH to the OMG Network

_By the end of this tutorial you should know how to deposit ETH to the root chain Plasma smart contract for subsequent use on the OMG network._

## Intro

The example uses a `deposit` function provided by the `omg-js` library to deposit ETH to the root chain smart contract.

## Prerequisites

1. Any amount of ETH in Alice's wallet. If you're using pre-defined `.env` configurations for Alice and Bob, the wallet won't be empty. Otherwise, top it up with [Ropsten faucet](https://faucet.metamask.io/) (for testnet) or actual ETH (for mainnet).

## Steps

1. App setup
2. Logging root chain and child chain ETH balances for Alice
3. Depositing ETH from the root chain to the child chain
4. Recording transaction by the Watcher

### 1. App setup

You can find the full Javascript segment of this tutorial in [deposit-eth.js](./deposit-eth.js) file. The first lines define dependent libraries, set up configs for child chain and root chain, define wallets` data to be used during the sample.

```
import BigNumber from "bn.js";
import Web3 from "web3";
import { ChildChain, RootChain, OmgUtil } from "@omisego/omg-js";
import wait from "../helpers/wait.js";
import config from "../../config.js";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const rootChain = new RootChain({
  web3,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const depositAmount = new BigNumber(
  web3.utils.toWei(config.alice_eth_deposit_amount, "ether")
);
```

### 2. Logging root chain and child chain ETH balances for Alice

Logging balances helps to see the changes in the wallet addresses before and after depositing funds. To see a more detailed example, please refer to [Retreive Balances](../01-balances/README.md) sample.

```
async function logBalances() {
  const rootchainBalance = await web3.eth.getBalance(aliceAddress);
  const childchainBalanceArray = await childChain.getBalance(aliceAddress);
  const ethObject = childchainBalanceArray.find(
    (i) => i.currency === OmgUtil.transaction.ETH_CURRENCY
  );
  const childchainETHBalance = ethObject
    ? `${web3.utils.fromWei(String(ethObject.amount))} ETH`
    : "0 ETH";

  console.log(
    `Alice's root chain ETH balance: ${web3.utils.fromWei(
      String(rootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(`Alice's child chain ETH balance: ${childchainETHBalance}`);
}
```

Example output:

```
Alice's root chain ETH balance: 4.36180962350024 ETH

Alice's child chain ETH balance: 0.606903 ETH

```

### 3. Depositing ETH from the root chain to the child chain

- To perform any operation on the OMG Network, you need to have funds. Funds deposit happens when a user sends ETH or ERC20 tokens to the `Vault` smart contract on Ethereum Network. A vault holds custody of tokens transferred to the Plasma Framework. Deposits increase the pool of funds held by the contract and also signals to the child chain server that the funds should be accessible on the child chain.
- A deposit generates a transaction receipt verifiable on Ethereum Network. A typical receipt has the following structure:

```
{
    "blockHash": "0x41455ed19db8e5a495233e54c1813962edaf8a5fb87f847a704c72efa90e2c71",
    "blockNumber": 7779244,
    "contractAddress": null,
    "cumulativeGasUsed": 391297,
    "from": "0x0dc8e240d90f3b0d511b6447543b28ea2471401a",
    "gasUsed": 130821,
    "logs": [
        {
            "address": "0x895Cc6F20D386f5C0deae08B08cCFeC9f821E7D9",
            "topics": [
                "0x18569122d84f30025bb8dffb33563f1bdbfb9637f21552b11b8305686e9cb307",
                "0x0000000000000000000000000dc8e240d90f3b0d511b6447543b28ea2471401a",
                "0x0000000000000000000000000000000000000000000000000000000000023e42",
                "0x0000000000000000000000000000000000000000000000000000000000000000"
            ],
            "data": "0x000000000000000000000000000000000000000000000000006a94d74f430000",
            "blockNumber": 7779244,
            "transactionHash": "0x0e7d060a63cb65f629cc6d053e71397c7fa3250b41e36cb2cae40b2acb4350a2",
            "transactionIndex": 12,
            "blockHash": "0x41455ed19db8e5a495233e54c1813962edaf8a5fb87f847a704c72efa90e2c71",
            "logIndex": 1,
            "removed": false,
            "id": "log_8b0a6416"
        }
    ],
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000001000000000024000000000000000000800000000000000000000010080000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000004000000010000000000000000000020000000000000000000000000000000000000080000022000000000000000000000",
    "status": true,
    "to": "0x895cc6f20d386f5c0deae08b08ccfec9f821e7d9",
    "transactionHash": "0x0e7d060a63cb65f629cc6d053e71397c7fa3250b41e36cb2cae40b2acb4350a2",
    "transactionIndex": 12
}
```

- A typical deposit uses `deposit` function provided by the `Rootchain` module of the `omg-js` library.
- After the funds are confirmed on the rootchain, child chain server generates a transaction in a form of UTXO corresponding to the deposited amount. UTXO (unspent output) is a model used to keep a track of balances on the OMG Network.
- If a transaction is successful, you will see a unique `transactionHash` that you can verify on Ethereum block explorer, such as [Etherescan](https://ropsten.etherscan.io/tx/0x0e7d060a63cb65f629cc6d053e71397c7fa3250b41e36cb2cae40b2acb4350a2). Copy the hash and paste in the search box to see details.
- Depositing also involves forming a pseudo-block on the child chain. Such a block contains a single transaction with the deposited funds as a new UTXO. You can check a new block on the OMG Network's [block explorer](https://blockexplorer.ropsten.v1.omg.network).

```
console.log(
  `Depositing ${web3.utils.fromWei(
    depositAmount.toString(),
    "ether"
  )} ETH from the root chain to the child chain`
);
const transactionReceipt = await rootChain.deposit({
  amount: depositAmount,
  txOptions: {
    from: aliceAddress,
    privateKey: alicePrivateKey,
    gas: 6000000,
  },
});
console.log("Deposit successful: ", transactionReceipt.transactionHash);
```

Example output:

```
Depositing 0.03 ETH from the root chain to the child chain

Deposit successful: 0x0e7d060a63cb65f629cc6d053e71397c7fa3250b41e36cb2cae40b2acb4350a2
```

### 4. Recording transaction by the Watcher

- Watcher is service one would need to run to perform validation for both root chain and child chain activities. It's one of the measures to ensure that the funds are safe and can't be maliciously spent or withdrawn back to the root chain network without required security checks. It would be great if everyone could run a watcher but unfortunately the process to set it up is rather complicated, so sufficient technical knowledge is required to run such a service at the moment.
- The current sample shows that `0.03 ETH` were sent to the root chain smart contract: the original amount was `4.36180962350024 ETH`, the amount after is `4.33167880250024 ETH`.
- You will have to wait for some time until the transaction confirms on the OMG Network. The current number of required confirmations is 20. At the end of this period, you will see the updated ETH balance of Alice's address: the original amount was `0.606903 ETH`, the amount after is `0.636903 ETH`.

```
console.log("Waiting for transaction to be recorded by the watcher...");
await OmgUtil.waitForRootchainTransaction({
  web3,
  transactionHash: transactionReceipt.transactionHash,
  checkIntervalMs: config.millis_to_wait_for_next_block,
  blocksToWait: config.blocks_to_wait_for_txn,
  onCountdown: (remaining) =>
    console.log(`${remaining} blocks remaining before confirmation`),
});

await wait.wait(5000);
console.log("-----");
await logBalances();
```

Example output:

```
Waiting for a transaction to be recorded by the watcher...

20 blocks remaining before confirmation

19 blocks remaining before confirmation

18 blocks remaining before confirmation

17 blocks remaining before confirmation

16 blocks remaining before confirmation

15 blocks remaining before confirmation

14 blocks remaining before confirmation

13 blocks remaining before confirmation

12 blocks remaining before confirmation

11 blocks remaining before confirmation

10 blocks remaining before confirmation

9 blocks remaining before confirmation

8 blocks remaining before confirmation

7 blocks remaining before confirmation

6 blocks remaining before confirmation

5 blocks remaining before confirmation

4 blocks remaining before confirmation

3 blocks remaining before confirmation

2 blocks remaining before confirmation

1 blocks remaining before confirmation

0 blocks remaining before confirmation

Waiting for 0.08335000000000001 min...

-----

Alice's root chain ETH balance: 4.33167880250024 ETH

Alice's child chain ETH balance: 0.636903 ETH
```

## Running the sample

1. Enter the `omg-js` folder if you're in the root `omg-samples` repository:

```
cd omg-js
```

2. Install dependencies:

```
npm install
```

3. Create `.env` file, modify configurations with required values (look at [.env.example](../../.env.example) or [README](../../README.md) of the `omg-js` repo for details).

4. Run the app:

```
npm run start
```

5. Open your browser at [http://localhost:3000](http://localhost:3000).

6. Select `02 - Make a Deposit ETH` sample on the left side, observe the logs on the right.

![img](../assets/images/02.png)
