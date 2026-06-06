import type { Route } from "./+types/home";
import { NotebookWorkspace } from "../features/notebook/notebook-workspace";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fountain Life Notebook" },
    { name: "description", content: "Fountain Life interview NotebookLM-style app" },
  ];
}

export default function Home() {
  return <NotebookWorkspace />;
}
