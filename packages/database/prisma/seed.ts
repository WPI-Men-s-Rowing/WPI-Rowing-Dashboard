import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

/**
 * Database seed function, reads the NK_AUTH_TOKEN from the env file and
 * puts it in the DB
 */
async function main() {
  // Validate we have the token
  if (!process.env.NK_AUTH_TOKEN) {
    throw new Error("Missing NK_AUTH_TOKEN Environment Variable!");
  }

  // Write the token
  const token = await prisma.nkCredential.create({
    data: {
      token: process.env.NK_AUTH_TOKEN!,
    },
  });
  console.log({ token }); // Write that we added the token
}

// Run the seed, then dsiconnect. If something goes wrong, output an error
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
