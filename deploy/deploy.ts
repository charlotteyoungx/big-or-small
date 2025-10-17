import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedBigOrSmall = await deploy("BigOrSmall", {
    from: deployer,
    log: true,
  });

  console.log(`BigOrSmall contract: `, deployedBigOrSmall.address);
};
export default func;
func.id = "deploy_big_or_small"; // id required to prevent reexecution
func.tags = ["BigOrSmall"];
