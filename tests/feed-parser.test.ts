import { describe, it, expect } from "vitest";
// @ts-expect-error - plain .mjs agent script without type declarations
import { parseRssItems, parseAtomItems, parseSourcePayload, isBlockedSource } from "../scripts/auto-news-agent.mjs";

const source = {
  name: "NVIDIA Developer Blog",
  href: "https://developer.nvidia.com/blog/feed/",
  topicHint: "Computer Systems"
};

describe("parseAtomItems", () => {
  // Regression: Atom feeds use attributes on the opening tag (<title type="html">).
  // The extractor previously matched bare tags only, so every entry lost its
  // title and the whole source was silently dropped.
  it("reads titles from tags that carry attributes", () => {
    const xml = `<feed><entry>
      <title type="html">Optimizing Inference Throughput</title>
      <link rel="alternate" type="text/html" href="https://developer.nvidia.com/blog/optimizing-inference/" />
      <updated>2026-09-10T16:55:39Z</updated>
      <summary type="html">A guide to serving models in production.</summary>
    </entry></feed>`;

    const items = parseAtomItems(xml, source);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Optimizing Inference Throughput");
    expect(items[0].href).toBe("https://developer.nvidia.com/blog/optimizing-inference/");
  });

  // Regression: CDATA sections were stripped as if they were tags, which
  // emptied the text instead of unwrapping it.
  it("unwraps CDATA titles and summaries instead of deleting them", () => {
    const xml = `<feed><entry>
      <title type="html"><![CDATA[How Full-Stack NIM Optimizations Deliver 2.5x More Users]]></title>
      <link rel="alternate" type="text/html" href="https://developer.nvidia.com/blog/full-stack-nim/" />
      <updated>2026-09-10T16:55:39Z</updated>
      <summary type="html"><![CDATA[Deploying a large language model is only the first step.]]></summary>
    </entry></feed>`;

    const items = parseAtomItems(xml, source);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("How Full-Stack NIM Optimizations Deliver 2.5x More Users");
    expect(items[0].summary).toBe("Deploying a large language model is only the first step.");
    expect(items[0].title).not.toContain("CDATA");
  });

  it("drops entries whose link leaves the source's own domain", () => {
    const xml = `<feed><entry>
      <title type="html">Sponsored elsewhere</title>
      <link rel="alternate" type="text/html" href="https://not-nvidia.example.com/post/" />
      <updated>2026-09-10T16:55:39Z</updated>
    </entry></feed>`;

    expect(parseAtomItems(xml, source)).toHaveLength(0);
  });
});

describe("parseRssItems", () => {
  const rssSource = {
    name: "Kubernetes Blog",
    href: "https://kubernetes.io/feed.xml",
    topicHint: "Cloud/DevOps"
  };

  it("reads CDATA-wrapped titles and descriptions", () => {
    const xml = `<rss><channel><item>
      <title><![CDATA[Kubernetes v1.36 Released]]></title>
      <link>https://kubernetes.io/blog/2026/09/10/k8s-v1-36/</link>
      <pubDate>Thu, 10 Sep 2026 16:55:39 GMT</pubDate>
      <description><![CDATA[The release focuses on scheduler stability.]]></description>
    </item></channel></rss>`;

    const items = parseRssItems(xml, rssSource);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Kubernetes v1.36 Released");
    expect(items[0].summary).toBe("The release focuses on scheduler stability.");
  });
});

describe("parseSourcePayload", () => {
  it("falls back to the Atom parser when the feed has no RSS items", () => {
    const xml = `<feed><entry>
      <title type="html"><![CDATA[Atom only feed]]></title>
      <link rel="alternate" type="text/html" href="https://developer.nvidia.com/blog/atom-only/" />
      <updated>2026-09-10T16:55:39Z</updated>
    </entry></feed>`;

    const items = parseSourcePayload(xml, source);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Atom only feed");
  });
});

describe("isBlockedSource", () => {
  // The editorial policy excludes preprint aggregators; the UI filters them
  // too, so anything that slips through here renders as an empty news feed.
  it("blocks arXiv by source name and by URL", () => {
    expect(isBlockedSource("arXiv cs.AI", "https://arxiv.org/abs/2606.23927")).toBe(true);
    expect(isBlockedSource("Some Feed", "https://arxiv.org/abs/2606.23927")).toBe(true);
    expect(isBlockedSource("Kubernetes Blog", "https://kubernetes.io/blog/post/")).toBe(false);
  });
});
