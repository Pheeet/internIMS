import "dotenv/config";

async function main() {
  console.log("No seed data");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});