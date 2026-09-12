import { createFileRoute } from "@tanstack/react-router";
import { FrondeApp } from "@/components/orbit/fronde-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <FrondeApp />;
}
