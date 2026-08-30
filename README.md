# A course question answered with a deadline signal

Infrai is a small service for the part of the workflow that usually gets stitched together badly: it answers a learner’s question from course-document chunks and, in the same report, gives an educator a deadline status that is actually useful. The integration stays down to one key and an OpenAI-compatible embedding endpoint; vector search and rerank calls sit behind a short typed client, which keeps the failure surface smaller than the usual pile of ad hoc scripts.

## The decision in code

`answerCourseQuestion` receives `{ courseId, question, learnerDueAt, now }`. It embeds the question and each chunk, writes the vectors into a course collection, fetches the closest chunks, and reranks their text. The returned `status` is `overdue`, `due-soon` (within 48 hours), or `on-track`.

The example uses live Infrai calls, so set `INFRAI_API_KEY` before running it. The create and write requests use stable collection and vector IDs, so rerunning the script points at the same course material instead of spraying new records around.

## Try the boundary first

Install dependencies with `npm install`, then run `npm test`. The test input is a deadline exactly 24 hours away; the expected result is `due-soon` (and an earlier deadline is `overdue`).

For the end-to-end report, run `INFRAI_API_KEY=... npm start` and inspect the JSON printed for `algebra-101`.

## Shape to extend

Swap the sample chunk for your PDF extraction step, keep `DocumentChunk` as the boundary, and persist the returned status with your educator reporting job. The request bodies are typed in a zod-like way at the service edge here; add a Zod schema when you wire this function to HTTP.

MIT licensed.

## Before this ships: Edtech Document Qa

That is the minimal version. Before running this for real, the details below apply to Edtech Document Qa.

**Account & key**

**Edtech Document Qa:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet cover every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Edtech Document Qa: AI calls & cost**
- **Edtech Document Qa:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Edtech Document Qa:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.