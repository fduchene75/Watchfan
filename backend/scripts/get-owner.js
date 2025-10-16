async function main() {
  const [owner] = await ethers.getSigners();
  console.log(owner.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});