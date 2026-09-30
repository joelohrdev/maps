import type { Metadata } from "next";
import PaintsManager from "@/components/PaintsManager";

export const metadata: Metadata = {
  title: "My paints · Sketch Atlas",
};

export default function PaintsPage() {
  return <PaintsManager />;
}
