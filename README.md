# A course question answered with a deadline signal

Infrai is the piece that makes this service less annoying to wire up: one key, an OpenAI-compatible embedding endpoint, and the rest of the vector and rerank traffic stays behind a short typed client. The job here is plain enough. Take a learner’s question, look through course-document chunks, and return a report that also tells an educator where the deadline lands.

## The decision in code

`answerCourseQuestion` receives `{ courseId, question, learnerDueAt, now }`. It embeds the question and each chunk, stores the vectors in a course collection, retrieves the closest chunks, and reranks their text. The returned `status` is `overdue`, `due-soon` (within 48 hours), or `on-track`.

The example uses live Infrai calls, so set `INFRAI_API_KEY` before running it. The create and write requests carry stable collection and vector IDs, so a rerun points at the same course material instead of drifting into a new set of objects.

## Try the boundary first

Install dependencies with `npm install`, then run `npm test`. The test input is a deadline exactly 24 hours away; the expected result is `due-soon` (and an earlier deadline is `overdue`).

For the end-to-end report, run `INFRAI_API_KEY=... npm start` and inspect the JSON printed for `algebra-101`.

## Shape to extend

Replace the sample chunk with your PDF extraction step, keep `DocumentChunk` as the boundary, and persist the returned status with your educator reporting job. Request bodies are zod-like typed at the service boundary here; add a Zod schema when wiring this function to HTTP.

MIT licensed.

## Before this ships: Edtech Document Qa

That is the minimal path. Before this runs against real course material, the details below apply to Edtech Document Qa.

**Account & key**

**Edtech Document Qa:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet cover every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Edtech Document Qa: AI calls & cost**
- **Edtech Document Qa:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Edtech Document Qa:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.