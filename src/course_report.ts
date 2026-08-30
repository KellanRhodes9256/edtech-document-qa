import { api, type DocumentChunk } from "./infrai_client.js";
import { deadlineStatus } from "./deadline.js";

export type CourseQuestion = { courseId: string; question: string; learnerDueAt: string; now: string };

export async function answerCourseQuestion(input: CourseQuestion, chunks: DocumentChunk[]) {
  const collection = `course-${input.courseId}`;
  const first = await api.embeddings(input.question);
  const embedding = first.data[0].embedding;
  await api.createCollection(collection, embedding.length);
  const vectors = await Promise.all(chunks.map(async (chunk, index) => ({ id: `${input.courseId}-${index}`, embedding: (await api.embeddings(chunk.text)).data[0].embedding, metadata: chunk })));
  await api.upsert(collection, vectors);
  const found = await api.query(collection, embedding, Math.min(5, chunks.length));
  const candidates = found.items.map((item) => item.metadata.text);
  const ranked = candidates.length ? await api.rerank(input.question, candidates, 3) : { items: [] };
  return { status: deadlineStatus({ dueAt: input.learnerDueAt, now: input.now }), sources: ranked.items.map((item) => candidates[item.index] ?? "") };
}

if (process.argv[1]?.endsWith("course_report.ts")) {
  const input: CourseQuestion = { courseId: "algebra-101", question: "What is the late submission policy?", learnerDueAt: "2026-09-02T09:00:00Z", now: "2026-09-01T09:00:00Z" };
  answerCourseQuestion(input, [{ courseId: input.courseId, title: "Policy", text: "Assignments submitted within 48 hours receive partial credit." }]).then((report) => console.log(JSON.stringify(report, null, 2)));
}
