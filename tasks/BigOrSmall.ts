import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("bos:address", "Prints the BigOrSmall address").setAction(async function (_: TaskArguments, hre) {
  const { deployments } = hre;
  const d = await deployments.get("BigOrSmall");
  console.log("BigOrSmall address is " + d.address);
});

task("bos:start", "Start a round with on-chain randomness")
  .addParam("roundid", "Round id (bytes32 hex)")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const dep = await deployments.get("BigOrSmall");
    const [signer] = await ethers.getSigners();

    const c = await ethers.getContractAt("BigOrSmall", dep.address);

    const tx = await c.connect(signer).startGame(args.roundid);
    console.log("tx:", tx.hash);
    await tx.wait();
  });

task("bos:bet", "Place bet")
  .addParam("roundid", "Round id")
  .addParam("choice", "1 small, 2 big")
  .addParam("value", "wei value to bet")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const dep = await deployments.get("BigOrSmall");
    const [signer] = await ethers.getSigners();
    const c = await ethers.getContractAt("BigOrSmall", dep.address);
    const tx = await c.connect(signer).placeBet(args.roundid, parseInt(args.choice), { value: args.value });
    console.log("tx:", tx.hash);
    await tx.wait();
  });

task("bos:reveal", "Reveal result")
  .addParam("roundid", "Round id")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const dep = await deployments.get("BigOrSmall");
    const [signer] = await ethers.getSigners();
    const c = await ethers.getContractAt("BigOrSmall", dep.address);
    const tx = await c.connect(signer).reveal(args.roundid);
    console.log("tx:", tx.hash);
    await tx.wait();
  });
