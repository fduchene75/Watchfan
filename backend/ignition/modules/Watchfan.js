// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("WatchfanModule", (m) => {
  const initialOwner = m.getAccount(0);
  const watchfan = m.contract("Watchfan", [initialOwner]);
  return { watchfan };
});
