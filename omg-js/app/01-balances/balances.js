import Web3 from "web3";
import { ChildChain, OmgUtil } from "@omisego/omg-js";
import config from "../../config";

const web3 = new Web3(new Web3.providers.HttpProvider(config.eth_node), null, {
  transactionConfirmationBlocks: 1,
});
const childChain = new ChildChain({
  watcherUrl: config.watcher_url,
  plasmaContractAddress: config.plasmaframework_contract_address,
});

async function logBalances() {
  const alicesBalanceArray = await childChain.getBalance(
    config.alice_eth_address
  );
  const aliceChildchainBalance = alicesBalanceArray.map((i) => {
    return {
      currency:
        i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
      amount:
        i.currency === OmgUtil.transaction.ETH_CURRENCY
          ? `${web3.utils.fromWei(String(i.amount))} ETH`
          : i.amount,
    };
  });
  const aliceRootchainBalance = await web3.eth.getBalance(
    config.alice_eth_address
  );
  const aliceRootchainBalances = [
    {
      currency: "ETH",
      amount: `${web3.utils.fromWei(
        String(aliceRootchainBalance),
        "ether"
      )} ETH`,
    },
  ];

  if (config.erc20_contract_address) {
    const aliceRootchainERC20Balance = await OmgUtil.getErc20Balance({
      web3,
      address: config.alice_eth_address,
      erc20Address: config.erc20_contract_address,
    });
    aliceRootchainBalances.push({
      currency: config.erc20_contract_address,
      amount: aliceRootchainERC20Balance,
    });
  }
  const bobsBalanceArray = await childChain.getBalance(config.bob_eth_address);
  const bobChildchainBalance = bobsBalanceArray.map((i) => {
    return {
      currency:
        i.currency === OmgUtil.transaction.ETH_CURRENCY ? "ETH" : i.currency,
      amount:
        i.currency === OmgUtil.transaction.ETH_CURRENCY
          ? `${web3.utils.fromWei(String(i.amount))} ETH`
          : i.amount,
    };
  });

  const bobRootchainBalance = await web3.eth.getBalance(config.bob_eth_address);
  const bobRootchainBalances = [
    {
      currency: "ETH",
      amount: `${web3.utils.fromWei(String(bobRootchainBalance), "ether")} ETH`,
    },
  ];

  if (config.erc20_contract_address) {
    const bobRootchainERC20Balance = await OmgUtil.getErc20Balance({
      web3,
      address: config.bob_eth_address,
      erc20Address: config.erc20_contract_address,
    });
    bobRootchainBalances.push({
      currency: config.erc20_contract_address,
      amount: bobRootchainERC20Balance,
    });
  }
  console.log(
    `Alice's rootchain balance: ${JSON.stringify(
      aliceRootchainBalances,
      null,
      2
    )}`
  );
  console.log(
    `Alice's childchain balance: ${JSON.stringify(
      aliceChildchainBalance,
      null,
      2
    )}`
  );
  console.log("----------");
  console.log(
    `Bob's rootchain balance: ${JSON.stringify(bobRootchainBalances, null, 2)}`
  );
  console.log(
    `Bob's childchain balance: ${JSON.stringify(bobChildchainBalance, null, 2)}`
  );
}

logBalances();
