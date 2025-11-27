import { projectsData } from "@/data/projects";
import { notFound } from "next/navigation";
import ProjectDemo from "@/components/projects/demos/ProjectDemo";

export async function generateStaticParams() {
  return projectsData.map((project) => ({
    id: project.id,
  }));
}

export default async function ProjectDemoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = projectsData.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  return <ProjectDemo project={project} />;
}

