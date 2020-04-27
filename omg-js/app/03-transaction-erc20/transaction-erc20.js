import { ChildChain, OmgUtil } from "@omisego/omg-js";
import BigNumber from "bn.js";
import Web3 from "web3";
import config from "../../config.js";

const rootChainPlasmaContractAddress = config.plasmaframework_contract_address;
const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  watcherProxyUrl: config.watcher_proxy_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

const aliceAddress = config.alice_eth_address;
const alicePrivateKey = config.alice_eth_address_private_key;
const bobAddress = config.bob_eth_address;
const transferAmount = new BigNumber(
  web3.utils.toWei(config.alice_erc20_transfer_amount, "ether")
);

async function logBalances() {
  const alicesBalanceArray = await childChain.getBalance(aliceAddress);
  const aliceErc20Object = alicesBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const alicesChildchainERC20Balance = aliceErc20Object
    ? aliceErc20Object.amount
    : 0;

  const bobsBalanceArray = await childChain.getBalance(bobAddress);
  const bobErc20Object = bobsBalanceArray.find(
    (i) =>
      i.currency.toLowerCase() === config.erc20_contract_address.toLowerCase()
  );
  const bobsChildchainERC20Balance = bobErc20Object ? bobErc20Object.amount : 0;

  console.log(
    `Alice's childchain ERC20 balance: ${web3.utils.fromWei(
      alicesChildchainERC20Balance.toString(),
      "ether"
    )}`
  );
  console.log(
    `Bob's childchain ERC20 balance: ${web3.utils.fromWei(
      bobsChildchainERC20Balance.toString(),
      "ether"
    )}`
  );
  return { bobERC20Balance: bobsChildchainERC20Balance };
}

async function transactionERC20() {
  if (!config.erc20_contract_address) {
    console.log("Please define an ERC20 contract address in your .env");
    return;
  }
  const { bobERC20Balance } = await logBalances();
  console.log("-----");

  const payments = [
    {
      owner: bobAddress,
      currency: config.erc20_contract_address,
      amount: transferAmount,
    },
  ];
  const fee = {
    currency: OmgUtil.transaction.ETH_CURRENCY,
  };

  const createdTxn = await childChain.createTransaction({
    owner: aliceAddress,
    payments,
    fee,
    metadata: "omg",
  });
  console.log(
    `Created a childchain transaction of ${web3.utils.fromWei(
      transferAmount.toString(),
      "ether"
    )} ERC20 from Alice to Bob.`
  );
  // type/sign/build/submit
  const typedData = OmgUtil.transaction.getTypedData(
    createdTxn.transactions[0],
    rootChainPlasmaContractAddress
  );
  const privateKeys = new Array(createdTxn.transactions[0].inputs.length).fill(
    alicePrivateKey
  );
  const signatures = childChain.signTransaction(typedData, privateKeys);
  const signedTxn = childChain.buildSignedTransaction(typedData, signatures);
  const receipt = await childChain.submitTransaction(signedTxn);
  console.log("Transaction submitted: " + receipt.txhash);

  console.log("Waiting for a transaction to be recorded by the watcher...");
  const expectedAmount = transferAmount + bobERC20Balance;
  await OmgUtil.waitForChildchainBalance({
    childChain,
    address: bobAddress,
    expectedAmount,
    currency: config.erc20_contract_address,
  });

  console.log("-----");
  await logBalances();
}

export { transactionERC20 };