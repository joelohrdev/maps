import { Suspense } from "react";
import Explorer from "@/components/Explorer";

export default function Home() {
  return (
    <Suspense>
      <Explorer />
    </Suspense>
  );
}
