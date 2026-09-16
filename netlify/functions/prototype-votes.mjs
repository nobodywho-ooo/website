import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";

const prototypeIDs = new Set([
  "glm-1",
  "glm-2",
  "glm-3",
  "glm-4",
  "sol-1",
  "sol-2",
  "sol-3",
  "sol-4",
  "sol-5",
  "sol-6",
  "sol-7",
  "sol-8",
  "sol-9",
  "sol-ottily",
]);

const scope = "site-v2";

const respond = ({ data, status = 200 }) => Response.json(
  { scope, ...data },
  { status, headers: { "Cache-Control": "no-store" } },
);

const countsFor = async ({ store }) => Object.fromEntries(await Promise.all(
  [...prototypeIDs].map(async (prototype) => {
    const voters = await store.get(prototype, {
      consistency: "strong",
      type: "json",
    });
    return [prototype, Array.isArray(voters) ? voters.length : 0];
  }),
));

const updateVote = async ({ action, prototype, store, voterHash }) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await store.getWithMetadata(prototype, {
      consistency: "strong",
      type: "json",
    });
    const voters = new Set(Array.isArray(current?.data) ? current.data : []);
    const hasVote = voters.has(voterHash);

    if ((action === "add" && hasVote) || (action === "remove" && !hasVote)) {
      return false;
    }

    if (action === "add") voters.add(voterHash);
    else voters.delete(voterHash);

    const result = await store.setJSON(prototype, [...voters], current
      ? { onlyIfMatch: current.etag }
      : { onlyIfNew: true });
    if (result.modified) return true;
  }

  throw new Error("Could not update vote after concurrent writes");
};

export default async (request) => {
  const store = getStore("prototype-votes-v2");

  if (request.method === "GET") {
    return respond({ data: { counts: await countsFor({ store }) } });
  }

  if (request.method !== "POST") {
    return respond({ data: { error: "Method not allowed" }, status: 405 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return respond({ data: { error: "Invalid JSON" }, status: 400 });
  }

  const { action, prototype, voterID } = payload;
  if (!prototypeIDs.has(prototype)) {
    return respond({ data: { error: "Unknown prototype" }, status: 400 });
  }
  if (!/^[a-zA-Z0-9-]{16,64}$/.test(voterID ?? "")) {
    return respond({ data: { error: "Invalid voter" }, status: 400 });
  }
  if (!["add", "remove"].includes(action)) {
    return respond({ data: { error: "Invalid action" }, status: 400 });
  }

  const voterHash = createHash("sha256").update(voterID).digest("hex");
  const changed = await updateVote({ action, prototype, store, voterHash });

  return respond({ data: { changed, counts: await countsFor({ store }) } });
};

export const config = { path: "/api/prototype-votes" };
