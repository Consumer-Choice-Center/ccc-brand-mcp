import assert from "node:assert/strict";
import test from "node:test";
import { reviewSpelling } from "../dist/spelling.js";

test("spelling review highlights mistakes and returns corrected copy", () => {
  const result = reviewSpelling({
    request: "Create a tamplate for consuemrs with better choiec.",
    headline: "THE GOVERMENT SHOULD RECIEVE FEEDBACK",
  });

  assert.equal(result.ok, false);
  assert.equal(result.hasCorrections, true);
  assert.equal(result.correctedFields.request, "Create a template for consumers with better choice.");
  assert.equal(result.correctedFields.headline, "THE GOVERNMENT SHOULD RECEIVE FEEDBACK");
  assert.deepEqual(
    result.corrections.map(({ field, original, corrected }) => ({ field, original, corrected })),
    [
      { field: "request", original: "tamplate", corrected: "template" },
      { field: "request", original: "consuemrs", corrected: "consumers" },
      { field: "request", original: "choiec", corrected: "choice" },
      { field: "headline", original: "GOVERMENT", corrected: "GOVERNMENT" },
      { field: "headline", original: "RECIEVE", corrected: "RECEIVE" },
    ],
  );
  assert.match(result.userNotice, /“tamplate” → “template”/);
  assert.match(result.highlightedCorrections.join("\n"), /~~consuemrs~~ → \*\*consumers\*\*/);
});

test("spelling review accepts British English and protects CCC domain terms", () => {
  const copy = "Use colour and behaviour examples for European travellers, tariffed parts, ecommerce, Fabio Fernandes, GDPR, NATO, TikTok, Airbnb, ChatGPT, and https://consumerchoicecenter.org/team/.";
  const result = reviewSpelling(
    { request: copy },
    { extraTerms: ["Fabio Fernandes", "Consumer Choice Center"] },
  );

  assert.equal(result.ok, true);
  assert.equal(result.hasCorrections, false);
  assert.equal(result.correctedFields.request, copy);
  assert.equal(result.userNotice, "No spelling errors detected.");
});

test("spelling review corrects separate fields without changing URLs or email addresses", () => {
  const result = reviewSpelling({
    body: "The goverment needs relevent guidlines.",
    source: "Read https://example.org/goverment and email goverment@example.org.",
  });

  assert.equal(result.correctedFields.body, "The government needs relevant guidelines.");
  assert.equal(result.correctedFields.source, "Read https://example.org/goverment and email goverment@example.org.");
  assert.equal(result.corrections.every((correction) => correction.field === "body"), true);
});
