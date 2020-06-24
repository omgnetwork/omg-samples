# Process an ETH Exit for Alice

_By the end of this tutorial you should know how to process an ETH exit for Alice wallet._

## Intro

The example uses the `processExits` function provided by the `Rootchain` module of the `omg-js` library to process an ETH exit for a defined wallet.

## Prerequisites

- At least one UTXO that has passed the challenge period and is ready to be processed.

## Steps

1. App setup
2. Logging root chain ETH balance for Alice
3. Checking the exit queue
4. Processing exits
5. Waiting for exit confirmation

### 1. App setup

You can find the full Javascript segment of this tutorial in [exit-process-eth.js](./exit-process-eth.js). The first lines define dependent libraries, set up configs for child chain and root chain, define wallet's data to be used during the sample.

```
import Web3 from "web3";
import { RootChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config.js";

// setup for fast confirmations
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});

const rootChain = new RootChain({
  web3,
  plasmaContractAddress: config.plasmaframework_contract_address,
});
const aliceAddress = config.bob_eth_address;
const alicePrivateKey = config.bob_eth_address_private_key;
const token = OmgUtil.transaction.ETH_CURRENCY;
```

### 2. Logging root chain ETH balance for Alice

Logging balances helps to see the changes in the wallets before and after making an exit. For more details, please refer to [Retrieve Balances](../01-balances/README.md) sample.

```
const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
console.log(
  `Alice's root chain balance: ${web3.utils.fromWei(
    String(aliceRootchainBalance),
    "ether"
  )} ETH`
);
console.log("-----");
```

Example output:

```
Alice's root chain balance: 4.658060987385107145 ETH
```

### 3. Checking the exit queue

Checking the exit queue helps to see how many available exits the OMG Network has at a given moment. For checking the exit queue, use the `getExitQueue` function provided by the `Rootchain` module of the `omg-js` library.

```
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
```

Example output:

```
Current ETH exit queue: [
  {
    "priority": "41815608332351361027661228625132185933719156833599161145803972677096377627",
    "exitableAt": "4/30/2020, 4:02:47 PM",
    "exitId": "89160667830158176691353175134635535334051099"
  },
  {
    "priority": "41817551028195764325326877131520998932097795613234764407293630707782817083",
    "exitableAt": "5/1/2020, 12:32:35 PM",
    "exitId": "1684424914325557521775690958865428683417883963"
  },
  {
    "priority": "41816206321871528304806923552666042533843387752628189022849825104829580317",
    "exitableAt": "4/30/2020, 10:21:20 PM",
    "exitId": "8401738825585107786388318953002999576559059997"
  },
  {
    "priority": "41817637147322283303174158548490173952629040970473819236351664960249183356",
    "exitableAt": "5/1/2020, 1:27:06 PM",
    "exitId": "7852454235673577064391987640411528438282370172"
  },
  {
    "priority": "41819924003735866460933795032643838789400667834972153033663035392913782591",
    "exitableAt": "5/2/2020, 1:34:46 PM",
    "exitId": "2764092707901949307008792616992248615269775167"
  },
  {
    "priority": "41816334934507721515063319189001831936295585645675083082036481260732266962",
    "exitableAt": "4/30/2020, 11:42:45 PM",
    "exitId": "680226923209033266958449440063742689980430802"
  },
  {
    "priority": "41816268982685071242483172541819333282198315087740440518763118341436438461",
    "exitableAt": "4/30/2020, 11:01:00 PM",
    "exitId": "3238265969664322107290505156601842200534284221"
  },
  {
    "priority": "41820058487532328085362190672843296111157422933722046482044330445651705600",
    "exitableAt": "5/2/2020, 2:59:54 PM",
    "exitId": "3100447060305733546952047770598946127289384704"
  },
  {
    "priority": "41820058487532328085362190670459288063231618290075735138311735789554525461",
    "exitableAt": "5/2/2020, 2:59:54 PM",
    "exitId": "716439012379928903305736426866351471192204565"
  }
]
```

### 4. Processing exits

Exit processing is the final stage you need to accomplish to return ETH funds from the child chain back to the root chain. For processing exits, use `processExits` function provided by the `Rootchain` module of the `omg-js` library.

The maximum number of exits you can process at the same time equals to the total number of your submitted exits that have passed the challenge period. You can set to process all exits at the same time or set a custom number of exits to process for testing purposes. The example uses 1 for `maxExitsToProcess`. For changing this number, modify the corresponding value of `maxExitsToProcess` key.

`exitId` key can take 0 or a string value of specific exitId. It's recommended to leave it as 0 to detect any exits that can be processed automatically.

```
console.log("Processing exit...");

const ethExitReceipt = await rootChain.processExits({
  token: token,
  exitId: 0,
  maxExitsToProcess: 1,
  txOptions: {
    privateKey: alicePrivateKey,
    from: aliceAddress,
    gas: 6000000,
  },
});

```

Example output:

```
Processing exit...
```

### 5. Waiting for exit confirmation

```
if (ethExitReceipt) {
  console.log(`ETH exits processing: ${ethExitReceipt.transactionHash}`);
  await OmgUtil.waitForRootchainTransaction({
    web3,
    transactionHash: ethExitReceipt.transactionHash,
    checkIntervalMs: config.millis_to_wait_for_next_block,
    blocksToWait: config.blocks_to_wait_for_txn,
    onCountdown: (remaining) =>
      console.log(`${remaining} blocks remaining before confirmation`),
  });
  console.log("ETH exits processed");
}
```

Example output:

```
ETH exits processing: 0xae5d499049a6e60e958f1bc59fe46f4dd9752b8b3edb3a6346ded8519d8a641d

12 blocks remaining before confirmation

11 blocks remaining before confirmation

10 blocks remaining before confirmation

9 blocks remaining before confirmation

7 blocks remaining before confirmation

6 blocks remaining before confirmation

5 blocks remaining before confirmation

4 blocks remaining before confirmation

3 blocks remaining before confirmation

2 blocks remaining before confirmation

0 blocks remaining before confirmation

ETH exits processed
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

6. Select `Process an ETH exit` sample on the left side, observe the logs on the right:

![img](../assets/images/12.png)
