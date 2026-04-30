import "dotenv/config";

async function main() {
  console.log("No default seed data");
  console.log("Use `npm run setup:test-accounts` to prepare deterministic local test accounts.");
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
