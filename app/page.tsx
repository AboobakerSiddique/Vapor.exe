import type { Metadata } from "next";
import { SmokingExperience } from "./smoking-experience";

export const metadata: Metadata = {
  title: "VAPOR.exe",
  description: "A digital smoke experience — real-time AR interaction powered entirely on your device.",
};

export default function Home() {
  return <SmokingExperience />;
}
