import { expect } from "chai";
import { ethers, deployments, fhevm } from "hardhat";

describe("BigOrSmall", function () {
  beforeEach(async () => {
    await deployments.fixture(["BigOrSmall"]);
  });

  it("starts, bets and reveals", async function () {
    const dep = await deployments.get("BigOrSmall");
    const [signer] = await ethers.getSigners();
    const c = await ethers.getContractAt("BigOrSmall", dep.address);

    // fund bank
    await signer.sendTransaction({ to: dep.address, value: ethers.parseEther("1") });

    const roundId = ethers.id("r1");
    await c.connect(signer).startGame(roundId);

    const stake = ethers.parseEther("0.001");
    await c.connect(signer).placeBet(roundId, 2, { value: stake });

    const balanceBefore = await ethers.provider.getBalance(dep.address);

    const tx = await c.connect(signer).reveal(roundId);
    await tx.wait();

    await fhevm.awaitDecryptionOracle();

    const balanceAfter = await ethers.provider.getBalance(dep.address);
    const roundInfo = await c.getRoundInfo(roundId);

    expect(roundInfo.player).to.eq(signer.address);
    expect(roundInfo.choice).to.eq(2n);
    expect(roundInfo.stake).to.eq(0n);
    expect(roundInfo.settled).to.eq(true);
    const resultValue = Number(roundInfo.result);
    expect(resultValue).to.be.gte(1).and.to.be.lte(6);

    const playerWon = resultValue >= 4;
    const expectedBank = playerWon ? balanceBefore - stake * 2n : balanceBefore;
    expect(balanceAfter).to.eq(expectedBank);
  });
});
