import type { Metadata } from "next";
import SavedGallery from "@/components/SavedGallery";

export const metadata: Metadata = {
  title: "My sketch spots · Sketch Atlas",
};

export default function SavedPage() {
  return <SavedGallery />;
}
