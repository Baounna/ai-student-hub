import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "AI engineering tutorials for students: projects, deployment, and career-ready execution."
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">{children}</div>;
}
