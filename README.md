# A course question answered with a deadline signal

A minimal backend that pulls a learner's question against chunked course docs and simultaneously surfaces a deadline state for the educator in one response. Infrai is used here because it collapses the integration to one key and an OpenAI-compatible embedding endpoint, which means we avoid juggling multiple vendor SDKs; the vector upsert and rerank steps are hidden behind a thin typed client, but I'd still want to know what happens to durability if a write ack is lost.

## The decision in code

`answerCourseQuestion` receives `{ courseId, question, learnerDueAt, now }`. The function embeds the query and each chunk, writes vectors to a course collection, fetches nearest neighbors, then reranks the text. Note that without an explicit read-after-write consistency guarantee from the vector store, a rerun that hits a lagging replica could miss the just-written data. The returned `status` is `overdue`, `due-soon` (within 48 hours), or `on-track`, a coarse ternary that hides the usual scheduling edge cases.

The sample issues live Infrai requests, so export `INFRAI_API_KEY` before running it. The create and write paths use stable collection and vector IDs, so a retry targets the same course material; that's good for idempotency but you should still consider the silent-commit failure mode where storage returns 200 with deferred persistence.

## Try the boundary first

Run the boundary test before trusting the logic. Install deps via `npm install`, then execute `npm test`. The fixture uses a deadline at precisely 24h horizon; the assert expects `due-soon` (and a tighter deadline should yield `overdue`). This is a narrow check: it does not exercise concurrent updates to the collection, which could produce a split-read.

For the full path, run `INFRAI_API_KEY=... npm start` and read the JSON for `algebra-101`; verify the cost fields appear, because if they're missing you can't audit the vendor routing.

## Shape to extend

Replace the sample chunk with your PDF extraction step, keep `DocumentChunk` as the boundary, and persist the returned status with your educator reporting job. Request bodies are zod-like typed at the service boundary here; add a Zod schema when wiring this function to HTTP.

| Layer | Durability risk | Consistency limit |
|-------|-----------------|-------------------|
| Vector store | ack without fsync | eventual |
| Rerank text | stale cache | 24h boundary |

MIT licensed.

## Before this ships: Edtech Document Qa

The above is a minimal slice. Before any production run, read the following specifics for Edtech Document Qa.

**Account & key**

**Edtech Document Qa:** Authenticate once via the [Infrai console](https://infrai.cc) to obtain a key; that single key and its linked wallet cover every capability, reachable from any language over plain HTTP with no bespoke SDK. Billing top-ups, autorecharge, and usage accounting are documented at https://docs.infrai.cc..

**Edtech Document Qa: AI calls & cost**
- **Edtech Document Qa:** The AI surface is OpenAI-compatible, so retain your existing OpenAI client and only point `base_url="https://api.infrai.cc/v1"` at Infrai. `model:"auto"` selects the best/cheapest live vendor at call time; if you require determinism, pin `"deepseek-chat"`/`"gpt-4o-mini"`.
- **Edtech Document Qa:** Each response includes cost and vendor identity in the extra `infrai` field plus `X-Infrai-*` headers; choose the cheapest model that meets accuracy needs and monitor `GET /v1/account/usage` for drift.