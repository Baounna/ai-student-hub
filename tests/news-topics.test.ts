import { describe, it, expect } from "vitest";
import { getNewsTopics, topicLabel } from "@/content/news";

/**
 * /fr/news printed "Computer Systems", "Career" and "Security & Performance"
 * in its theme filter and on every card, on a page whose headings, dates and
 * summaries were French. The topic is stored in English because it doubles as
 * the ?topic= filter key, the track lookup and the JSON-LD articleSection, so
 * only the display is translated.
 */
describe("topicLabel", () => {
  const topics = getNewsTopics();

  it("has a French label for every topic in the data", () => {
    const missing = topics.filter((topic) => topicLabel(topic, "fr") === topic && /[A-Za-z]/.test(topic) && !isSameInBoth(topic));

    expect(missing).toEqual([]);
  });

  // MLOps and Cloud/DevOps really are written the same way in French. Listing
  // them keeps the map the full set rather than the exceptions, so a new topic
  // shows up as missing above instead of silently passing through.
  function isSameInBoth(topic: string) {
    return ["MLOps", "Cloud/DevOps"].includes(topic);
  }

  it("leaves the English labels alone", () => {
    for (const topic of topics) {
      expect(topicLabel(topic, "en")).toBe(topic);
    }
  });

  it("passes an unknown topic through rather than blanking it", () => {
    // The automated feed invents its own topics; showing the raw value beats
    // showing nothing.
    expect(topicLabel("Quantum Widgets", "fr")).toBe("Quantum Widgets");
    expect(topicLabel("", "fr")).toBe("");
  });
});
