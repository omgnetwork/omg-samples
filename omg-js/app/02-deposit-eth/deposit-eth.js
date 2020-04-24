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

async function depositETH() {
  await logBalances();
  console.log("-----");

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
  console.log(
    "Deposit successful: " + String(transactionReceipt.transactionHash)
  );

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
}

export { depositETH };
