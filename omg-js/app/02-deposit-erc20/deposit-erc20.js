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
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.bob_eth_address;
const alicePrivateKey = config.bob_eth_address_private_key;
const depositAmount = new BigNumber(
  web3.utils.toWei(config.alice_erc20_deposit_amount, "ether")
);

async function logBalances() {
  const rootchainERC20Balance = await OmgUtil.getErc20Balance({
    web3,
    address: aliceAddress,
    erc20Address: config.erc20_contract_address,
  });
  const childchainBalanceArray = await childChain.getBalance(aliceAddress);
  const erc20Object = childchainBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const childchainERC20Balance = erc20Object ? erc20Object.amount : 0;

  console.log(
    `Alice's root chain ERC20 balance: ${web3.utils.fromWei(
      rootchainERC20Balance.toString(),
      "ether"
    )}`
  );
  console.log(
    `Alice's child chain ERC20 balance: ${web3.utils.fromWei(
      childchainERC20Balance.toString(),
      "ether"
    )}`
  );
}

async function depositErc20() {
  if (!config.erc20_contract_address) {
    console.log("Please define an ERC20 contract address in your .env");
    return;
  }

  await logBalances();
  console.log("-----");

  console.log("Approving ERC20 for deposit...");
  const approveRes = await rootChain.approveToken({
    erc20Address: config.erc20_contract_address,
    amount: depositAmount,
    txOptions: {
      from: aliceAddress,
      privateKey: alicePrivateKey,
      gas: 6000000,
    },
  });
  console.log("ERC20 approved: " + String(approveRes.transactionHash));

  console.log(
    `Depositing ${web3.utils.fromWei(
      depositAmount.toString(),
      "ether"
    )} ERC20 from the root chain to the child chain`
  );
  const transactionReceipt = await rootChain.deposit({
    amount: depositAmount,
    currency: config.erc20_contract_address,
    txOptions: {
      from: aliceAddress,
      privateKey: alicePrivateKey,
      gas: 6000000,
    },
  });
  console.log(
    "Deposit successful: " + String(transactionReceipt.transactionHash)
  );

  console.log("Waiting for a transaction to be recorded by the watcher...");
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

export { depositErc20 };
