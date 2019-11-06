const Migrations = artifacts.require("Migrations")
const LoanContract = artifacts.require("LoanContract")

module.exports = async (deployer) => {
  await deployer.deploy(Migrations)
  await deployer.deploy(LoanContract)
  console.log('migrate complete')
};