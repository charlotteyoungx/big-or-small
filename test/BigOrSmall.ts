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
    const encryptedDice = await fhevm
      .createEncryptedInput(dep.address, signer.address)
      .add8(5)
      .encrypt();

    await c.connect(signer).startGame(roundId, encryptedDice.handles[0], encryptedDice.inputProof);

    const stake = ethers.parseEther("0.001");
    await c.connect(signer).placeBet(roundId, 2, { value: stake });

    const balanceBefore = await ethers.provider.getBalance(dep.address);

    const tx = await c.connect(signer).reveal(roundId);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(dep.address);
    const roundInfo = await c.getRoundInfo(roundId);

    expect(roundInfo.player).to.eq(signer.address);
    expect(roundInfo.choice).to.eq(2n);
    expect(roundInfo.stake).to.eq(0n);
    expect(roundInfo.settled).to.eq(true);
    expect(roundInfo.result).to.eq(5);

    const expectedBank = balanceBefore - stake * 2n;
    expect(balanceAfter).to.eq(expectedBank);
  });
});
