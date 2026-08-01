import { notFound } from "next/navigation"
import { ProjectReader } from "../../../../components/project-reader"

const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788"
type Project = { title: string; description: string; content: string; coverUrl: string; tags: string[]; url: string }

async function getProject(slug: string): Promise<Project | null> {
  try {
    const response = await fetch(`${API}/projects/${slug}`, { next: { revalidate: 60 } })
    return response.ok ? response.json() : null
  } catch { return null }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const project = await getProject((await params).slug)
  if (!project) notFound()
  return <ProjectReader project={project} />
}
