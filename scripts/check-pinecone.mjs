import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "dotenv";

config();

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME;

console.log("PINECONE_API_KEY set:", Boolean(apiKey));
console.log("PINECONE_INDEX_NAME:", indexName || "(missing)");
console.log("GROQ_API_KEY set:", Boolean(process.env.GROQ_API_KEY));

if (!apiKey || !indexName) {
  console.log("RESULT: Missing Pinecone env vars");
  process.exit(1);
}

try {
  const pc = new Pinecone({ apiKey });
  const indexes = await pc.listIndexes();
  const names = indexes.indexes?.map((i) => i.name) || [];
  console.log("Available indexes:", names.join(", ") || "(none)");

  if (!names.includes(indexName)) {
    console.log("RESULT: Target index NOT found");
    process.exit(1);
  }

  const desc = await pc.describeIndex(indexName);
  console.log("Index dimension:", desc.dimension);
  console.log("Index status:", desc.status?.state);

  const index = pc.index(indexName);
  const stats = await index.describeIndexStats();
  console.log("Index stats:", JSON.stringify(stats, null, 2));

  console.log("RESULT: Pinecone connection OK");
} catch (e) {
  console.error("RESULT: Pinecone connection FAILED");
  console.error(e.message);
  process.exit(1);
}
