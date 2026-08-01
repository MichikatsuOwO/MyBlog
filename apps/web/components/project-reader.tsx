"use client"

import Link from "next/link"
import { Markdown } from "./markdown"

type Project = { title: string; description: string; content: string; coverUrl: string; tags: string[]; url: string }

export function ProjectReader({ project }: { project: Project }) {
  return <div className="reader-site reader-serif project-reader-site">
    <header className="reader-header">
      <Link href="/" className="reader-back">← 返回博客</Link>
      {project.url && <a className="reader-settings-trigger" href={project.url} target="_blank" rel="noreferrer">访问项目 ↗</a>}
    </header>
    <main className="reader-main project-reader-main">
      <article className="reader-article project-reader-article">
        {project.coverUrl && <img className="project-detail-cover" src={project.coverUrl} alt={`${project.title} 项目封面`} />}
        <div className="reader-kicker">项目案例</div>
        <h1>{project.title}</h1>
        <p className="project-detail-summary">{project.description}</p>
        {project.tags.length > 0 && <div className="project-detail-tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        <div className="reader-rule" />
        <Markdown content={project.content || "## 项目详情\n\n项目作者正在补充背景、实现过程和项目展示。"} />
      </article>
    </main>
  </div>
}
