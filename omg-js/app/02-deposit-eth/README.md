# Retrieve rootchain and childchain balances

_By the end of this tutorial you should know how to deposit funds from the rootchain to the childchain._

## Intro

The example uses `deposit` function provided by `omg-js` library to deposit funds to the OMG Network.

## Steps

1. App setup
2. Logging rootchain and childchain ETH balances for Alice
3. Depositing funds to the OMG Network
4. Recording transaction by the Watcher

### 1. App setup

You can find the full Javascript segment of this tutorial in `02-deposit/deposit-eth.js`. The first lines define dependent libraries, set up configs for childchain and rootchain, define wallets` data to be used during the sample.

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

### 2. Logging rootchain and childchain ETH balances for Alice
Logging balances helps to see the changes in the wallet addresses before and after depositing funds. To see more detailed example, please refer to `01 - Retrieve Balances` sample.

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
    `Alice's rootchain ETH balance: ${web3.utils.fromWei(
      String(rootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(`Alice's childchain ETH balance: ${childchainETHBalance}`);
}
```

Example output:
```
Alice's rootchain ETH balance: 4.36180962350024 ETH
 
Alice's childchain ETH balance: 0.606903 ETH
 
-----
 
Depositing 0.03 ETH from the rootchain to the childchain
```

### 3. Depositing funds to the OMG Network

- To perform any operation on the OMG Network, you need to have funds. Funds deposit happens when a user sends ETH or ERC20 tokens to the `PlasmaFramework` smart contract on Ethereum Network. The smart contract contains an equivalent of funds on the OMG Network at a given moment. It also ensures the safety of the childchain network.
- A deposit generates a transaction receipt verifiable on Ethereum network. A typical receipt has the following structure:

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
- You can create a deposit using `deposit` function provided by the `Rootchain` module of the `omg-js` library.
- After the funds are confirmed, childchain server generates a transaction in a form of UTXO corresponding to the deposited amount. UTXO (unspent output) is a model used to keep a track of balances on the OMG Network.
- If a transaction is successful, you will see a unique `transactionHash` that you can verify on Ethereum block expoler, such as [Etherescan](https://ropsten.etherscan.io/tx/0x0e7d060a63cb65f629cc6d053e71397c7fa3250b41e36cb2cae40b2acb4350a2). Simply copy the hash and paste in the search box.

```
console.log(
  `Depositing ${web3.utils.fromWei(
    depositAmount.toString(),
    "ether"
  )} ETH from the rootchain to the childchain`
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
Deposit successful: 0x0e7d060a63cb65f629cc6d053e71397c7fa3250b41e36cb2cae40b2acb4350a2
```

### 4. Recording transaction by the Watcher

- Watcher is service one would need to run to perform validation for both roothchain and childchain activities. It's one of measures to ensure that the funds are safe and can't be maliciosly spent or withdrawn back to the rootchain network without required security checks. It would be great if everyone could run a watcher but unfortunately the process to set it up is rather complicated, so a sufficient technical knowledge is required to run such a service at the moment.
- The current sample shows that `0.03 ETH` were sent to the rootchain smart contract: the original amount was `4.36180962350024 ETH`, the amount after is `4.33167880250024 ETH`. 
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
Waiting for transaction to be recorded by the watcher...
 
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
 
Alice's rootchain ETH balance: 4.33167880250024 ETH
 
Alice's childchain ETH balance: 0.636903 ETH
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