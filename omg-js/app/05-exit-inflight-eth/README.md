# Start an In-flight ETH Exit for Bob

_By the end of this tutorial you should know how to start an in-flight ETH exit to the root chain._

## Intro

The example uses the `startInFlightExit` function provided by the `Rootchain` module of the `omg-js` library to start an in-flight ETH exit from the child chain to the root chain.

## Prerequisites

- Any amount of ETH in Bob's OMG Network wallet. If you're using pre-defined `.env` configurations for Alice and Bob, the wallet should contain test ETH. Otherwise, top it up with [Ropsten faucet](https://faucet.metamask.io/) (for testnet) or actual ETH (for mainnet).

## Steps

1. App setup
2. Logging child chain ETH balances for Alice and Bob
3. Creating a payment transaction
4. Signing and building a transaction
5. Starting an in-flight exit
6. Piggybacking Bob's output
7. Checking the exit queue

### 1. App setup

You can find the full Javascript segment of this tutorial in [exit-inflight-eth.js](./exit-inflight-eth.js). The first lines define dependent libraries, set up configs for child chain and root chain, define wallet's data to be used during the sample.

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
const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const bobAddress = config.bob_eth_address;
const bobPrivateKey = config.bob_eth_address_private_key;
const ETH_CURRENCY = OmgUtil.transaction.ETH_CURRENCY;
```

### 2. Logging child chain ETH balances for Alice and Bob

Logging balances helps to see the changes in the wallets before and after making any transaction. For more details, please refer to [Retrieve Balances](../01-balances/README.md) sample.

```
async function logBalances() {
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  const bobRootchainBalance = await web3.eth.getBalance(bobAddress);

  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const alicesEthObject = alicesBalanceArray.find(
    (i) => i.currency === ETH_CURRENCY
  );
  const alicesChildchainETHBalance = alicesEthObject
    ? `${web3.utils.fromWei(String(alicesEthObject.amount))} ETH`
    : "0 ETH";

  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobsEthObject = bobsBalanceArray.find(
    (i) => i.currency === ETH_CURRENCY
  );
  const bobsChildchainETHBalance = bobsEthObject
    ? `${web3.utils.fromWei(String(bobsEthObject.amount))} ETH`
    : "0 ETH";

  console.log(
    `Alice's root chain ETH balance: ${web3.utils.fromWei(
      String(aliceRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(
    `Bob's root chain ETH balance: ${web3.utils.fromWei(
      String(bobRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log(`Alice's child chain ETH balance: ${alicesChildchainETHBalance}`);
  console.log(`Bob's child chain ETH balance: ${bobsChildchainETHBalance}`);
}
```

Example output:

```
Alice's root chain ETH balance: 3.416325898499585895 ETH

Bob's root chain ETH balance: 4.754654532385107145 ETH

Alice's child chain ETH balance: 1.481243 ETH

Bob's child chain ETH balance: 0.13389 ETH

```

### 3. Creating a payment transaction

- For creating an in-flight exit, you need to create a new transaction that has been signed but hasn't been submitted to the network.
- A transaction is considered to be “in-flight” if it has been broadcasted but has not yet been included in the child chain. It may also be in-flight from the perspective of an individual user if that user does not have access to the block where the defined transaction is included.
- The process of creating an ETH transaction is described in detail in [Make an ETH Transfer](../03-transaction-eth/README.md) sample.
- The creation of a transaction starts with `createTransaction` function provided by the `Childchain` module of the `omg-js` library.

```
const transferAmount = new BigNumber(
  web3.utils.toWei(config.alice_eth_transfer_amount, "ether")
);
const payments = [
  {
    owner: bobAddress,
    currency: ETH_CURRENCY,
    amount: Number(transferAmount),
  },
];
const fee = {
  currency: ETH_CURRENCY,
};
const createdTxn = await childChain.createTransaction({
  owner: aliceAddress,
  payments,
  fee,
});
console.log(
  `Created a child chain transaction of ${web3.utils.fromWei(
    payments[0].amount.toString(),
    "ether"
  )} ETH from Alice to Bob`
);
```

Example output:

```
Created a child chain transaction of 0.005 ETH from Alice to Bob
```

### 4. Signing and building a transaction

- Each transaction should be signed by the owner of funds (UTXOs).
- The payment transaction should have a specific format and encoded with [RLP encoding](https://github.com/ethereum/wiki/wiki/RLP).
- The private key used to sign a transaction shouldn't be exposed to anyone under no circumstances. You should treat it more seriously than your bank account password.

```
// type/sign/build/submit
const typedData = OmgUtil.transaction.getTypedData(
  createdTxn.transactions[0],
  rootChainPlasmaContractAddress
);
const signatures = childChain.signTransaction(typedData, [alicePrivateKey]);
const signedTxn = childChain.buildSignedTransaction(typedData, signatures);
console.log("The transaction has been created but wasn't submitted");

// Bob hasn't seen the transaction gets put into a block and he wants to exit his output.

// check if queue exists for this token
const hasToken = await rootChain.hasToken(ETH_CURRENCY);
if (!hasToken) {
  console.log(`Adding a ${ETH_CURRENCY} exit queue`);
  await rootChain.addToken({
    token: ETH_CURRENCY,
    txOptions: { from: bobAddress, privateKey: bobPrivateKey },
  });
}
```

Example output:

```
Signing transaction...

Building transaction...

The transaction has been created but wasn't submitted
```

### 5. Starting an in-flight exit

An in-flight exit starts with `startInFlightExit` function provided by the `Rootchain` module of the `omg-js` library.

For checking the amount of time your exit will be available for processing, use `getExitTime` provided by the `Rootchain` module of the `omg-js` library. The time is returned in milliseconds. Feel free to convert it to a more convenient way.

```

// start an in-flight exit
console.log("Starting an in-flight exit...");
const exitData = await childChain.inFlightExitGetData(
  OmgUtil.hexPrefix(signedTxn)
);
const exitReceipt = await rootChain.startInFlightExit({
  inFlightTx: exitData.in_flight_tx,
  inputTxs: exitData.input_txs,
  inputUtxosPos: exitData.input_utxos_pos,
  inputTxsInclusionProofs: exitData.input_txs_inclusion_proofs,
  inFlightTxSigs: exitData.in_flight_tx_sigs,
  txOptions: {
    privateKey: bobPrivateKey,
    from: bobAddress,
    gas: 6000000,
  },
});
console.log("Bob starts an inflight exit: " + exitReceipt.transactionHash);
const exitId = await rootChain.getInFlightExitId({
  txBytes: exitData.in_flight_tx,
});
console.log("Exit id: " + exitId);

```

Example output:

```
Starting an in-flight exit...

Bob starts an inflight exit: 0xc6a53a48730c9267512421c13ccb10dd9a6efb691d36275ae7f72d6e892545ab

Exit id: 3238265969664322107290505156601842200534284221
```

### 6. Piggybacking Bob's output

For piggybacking in-flight outputs use `piggybackInFlightExitOnOutput` function provided by the `Rootchain` module of the `omg-js` library.

To exit an input or output of an in-flight transaction the user has to piggyback on it. When in-flight transaction exits, the child chain removes the inputs of the in-flight transaction from the spendable set and they can no longer be spent. Notice, if you don't piggyback your outputs, you won't be able to exit the funds from the network.

```
// Decode the transaction to get the index of Bob's output
const outputIndex = createdTxn.transactions[0].outputs.findIndex(
  (e) => e.owner.toLowerCase() === bobAddress.toLowerCase()
);

// Bob needs to piggyback his output on the in-flight exit
await rootChain.piggybackInFlightExitOnOutput({
  inFlightTx: exitData.in_flight_tx,
  outputIndex: outputIndex,
  txOptions: {
    privateKey: bobPrivateKey,
    from: bobAddress,
  },
});
console.log("Bob piggybacks his output...");

```

Example output:

```
Bob piggybacks his output...
Bob has piggybacked his output...
```

### 7. Checking the exit queue

You may want to verify that your id was included in the exit queue. You can do that by using the `getExitQueue` function provided by the `Rootchain` module of the `omg-js` library.

```
async function exitQueue() {
  const ethQueue = await rootChain.getExitQueue();
  const ethQueueHuman = ethQueue.map((e) => {
    const container = {};
    container.priority = e.priority;
    container.exitableAt = new Date(
      parseInt(e.exitableAt * 1000)
    ).toLocaleString();
    container.exitId = e.exitId;
    return container;
  });

  console.log(
    "Current ETH exit queue: " + JSON.stringify(ethQueueHuman, null, 2)
  );
}
```

Example output:

```
Current ETH exit queue: [
  ...
  {
    "priority": "...",
    "exitableAt": "4/30/2020, 11:01:10 PM",
    "exitId": "3238265969664322107290505156601842200534284221"
  }
]
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

6. Select `Start an In-flight ETH Exit` sample on the left side, observe the logs on the right:

![img](../assets/images/11.png)
