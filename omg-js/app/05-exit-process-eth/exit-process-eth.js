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
const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const exitId = 0;
const token = config.erc20_contract_address;

async function exitProcessEth() {
  const aliceRootchainBalance = await web3.eth.getBalance(aliceAddress);
  console.log(
    `Alice's root chain balance: ${web3.utils.fromWei(
      String(aliceRootchainBalance),
      "ether"
    )} ETH`
  );
  console.log("-----");

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
  if (ethQueue.length) {
    console.log(
      "Current ETH exit queue: " + JSON.stringify(ethQueueHuman, null, 2)
    );
    console.log("Processing exit " + exitId);

    const ethExitReceipt = await rootChain.processExits({
      token: token,
      exitId: exitId,
      maxExitsToProcess: 1,
      txOptions: {
        privateKey: alicePrivateKey,
        from: aliceAddress,
        gas: 6000000,
      },
    });
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
  } else {
    console.log("No exits in ETH exit queue to process");
  }
}

export { exitProcessEth };
