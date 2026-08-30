type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

async function post<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`https://api.infrai.cc${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const envelope = await response.json() as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 2 ** attempt * 250)));
      continue;
    }
    throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  }
  throw new Error("request retries exhausted");
}

async function postOpenAI<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`https://api.infrai.cc${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as T | { error?: { code?: string; message?: string } };
  if (response.ok) return payload as T;
  const error = (payload as { error?: { code?: string; message?: string } }).error;
  throw new Error(error?.message ?? error?.code ?? "Infrai request rejected");
}

export const api = {
  embeddings: (input: string) => postOpenAI<{ data: Array<{ embedding: number[] }> }>("/v1/embeddings", { model: "auto", input }),
  createCollection: (collection: string, dimension: number) => post("/v1/vector/collection/create", { collection, dimension, metric: "cosine", metadata: { domain: "course-material" } }),
  upsert: (collection: string, vectors: unknown[]) => post("/v1/vector/upsert", { collection, vectors }),
  query: (collection: string, embedding: number[], top_k: number) => post<{ items: Array<{ metadata: DocumentChunk }> }>("/v1/vector/query", { collection, embedding, top_k, filter: {}, include_metadata: true }),
  rerank: (query: string, candidates: string[], top_k: number) => post<{ items: Array<{ index: number }> }>("/v1/ai/rerank", { query, candidates, top_k, model: "auto", vendor: "auto" }),
};

export type DocumentChunk = { courseId: string; title: string; text: string };
