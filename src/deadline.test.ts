import { strict as assert } from "node:assert";
import { deadlineStatus } from "./deadline.js";

assert.equal(deadlineStatus({ dueAt: "2026-09-02T09:00:00Z", now: "2026-09-01T09:00:00Z" }), "due-soon");
assert.equal(deadlineStatus({ dueAt: "2026-08-31T09:00:00Z", now: "2026-09-01T09:00:00Z" }), "overdue");
console.log("deadline decisions pass");
