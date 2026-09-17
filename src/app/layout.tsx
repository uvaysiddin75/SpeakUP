import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SpeakUp",
  description: "Learn English. Speak with Confidence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
