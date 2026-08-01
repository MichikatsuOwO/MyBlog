"use client"

import { FormEvent, useRef, useState } from "react"
import { Markdown } from "./markdown"

type Status = "draft" | "hidden" | "published"
export type EditableProject = { id?: number; title: string; slug: string; description: string; content: string; coverUrl: string; tags: string[]; url: string; status: Status }

type Props = {
  project: EditableProject
  setProject: (project: EditableProject) => void
  back: () => void
  save: (event: FormEvent) => void
  upload: (file: File) => Promise<string>
  loading: boolean
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

export function ProjectEditor({ project, setProject, back, save, upload, loading }: Props) {
  const coverInput = useRef<HTMLInputElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const contentInput = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)
  const [uploading, setUploading] = useState("")

  const update = (next: Partial<EditableProject>) => setProject({ ...project, ...next })
  const insert = (before: string, after = "", fallback = "文字") => {
    const field = contentInput.current
    const start = field?.selectionStart ?? project.content.length
    const end = field?.selectionEnd ?? start
    const selected = project.content.slice(start, end) || fallback
    update({ content: `${project.content.slice(0, start)}${before}${selected}${after}${project.content.slice(end)}` })
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(start + before.length, start + before.length + selected.length) })
  }
  const uploadCover = async (file?: File) => {
    if (!file) return
    setUploading("正在上传封面…")
    try { update({ coverUrl: await upload(file) }) } catch (error) { setUploading(error instanceof Error ? error.message : "封面上传失败。 "); return }
    setUploading("")
  }
  const uploadProjectImage = async (file?: File) => {
    if (!file) return
    setUploading("正在上传项目截图…")
    try {
      const url = await upload(file)
      update({ content: `${project.content.trim()}\n\n![项目截图](${url})\n` })
    } catch (error) { setUploading(error instanceof Error ? error.message : "图片上传失败。 "); return }
    setUploading("")
  }

  return <section className="editor-shell">
    <div className="editor-top"><button className="back-button" onClick={back} type="button">← 返回项目列表</button><span>{project.id ? "编辑项目" : "新建项目"}</span></div>
    <form className="editor writer-layout project-editor" onSubmit={save}>
      <div className="editor-main writer-canvas">
        <input className="title-input" placeholder="项目名称" value={project.title} onChange={(event) => update({ title: event.target.value, slug: project.slug || slugify(event.target.value) })} />
        <div className="slug-field"><span>blog.michikatsu.top/projects/</span><input placeholder="project-slug" value={project.slug} onChange={(event) => update({ slug: slugify(event.target.value) })} /></div>
        <textarea className="excerpt-input" placeholder="一句话简介：项目卡片会展示这段内容" value={project.description} onChange={(event) => update({ description: event.target.value })} />
        <section className="project-media-panel">
          <div><b>项目封面</b><p>用于 Projects 列表；建议使用 16:9 截图。</p></div>
          {project.coverUrl ? <img src={project.coverUrl} alt="项目封面预览" /> : <div className="project-cover-placeholder">上传项目截图作为封面</div>}
          <input ref={coverInput} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadCover(event.target.files?.[0])} />
          <div className="project-media-actions"><button type="button" className="secondary-button" onClick={() => coverInput.current?.click()}>上传封面</button><button type="button" className="text-button" onClick={() => update({ coverUrl: "" })} disabled={!project.coverUrl}>移除封面</button></div>
        </section>
        <div className="content-header"><span>项目详情（Markdown）</span><div><button type="button" className="text-button project-image-upload" onClick={() => imageInput.current?.click()}>上传项目截图</button><button type="button" className="preview-button" onClick={() => setPreview(!preview)}>{preview ? "返回编辑" : "预览详情"}</button></div></div>
        <input ref={imageInput} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadProjectImage(event.target.files?.[0])} />
        {preview ? <div className="markdown-preview project-markdown-preview"><Markdown content={project.content || "## 项目详情\n\n从这里补充项目背景、核心功能、技术方案和项目截图。"} /></div> : <><div className="markdown-toolbar"><button type="button" onClick={() => insert("## ", "", "项目背景")}>H2</button><button type="button" onClick={() => insert("### ", "", "核心功能")}>H3</button><button type="button" onClick={() => insert("**", "**", "加粗文字")}>B</button><button type="button" onClick={() => insert("[", "](https://)", "链接文字")}>链接</button><button type="button" onClick={() => imageInput.current?.click()}>图片</button></div><textarea ref={contentInput} className="content writer-content project-detail-input" placeholder={"## 项目背景\n\n说明你要解决的问题。\n\n## 核心功能\n\n- 功能一\n- 功能二\n\n## 项目展示\n\n点击“上传项目截图”后会自动插入图片。"} value={project.content} onChange={(event) => update({ content: event.target.value })} /></>}
        {uploading && <p className="project-upload-notice">{uploading}</p>}
      </div>
      <aside className="publish-panel"><h2>项目设置</h2><label>状态<select value={project.status} onChange={(event) => update({ status: event.target.value as Status })}><option value="draft">草稿</option><option value="published">发布</option><option value="hidden">隐藏</option></select></label><label>技术标签<input placeholder="例如：Next.js, PostgreSQL" value={project.tags.join(", ")} onChange={(event) => update({ tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><label>项目链接 / 仓库链接<input placeholder="https://..." value={project.url} onChange={(event) => update({ url: event.target.value })} /></label><button disabled={loading || Boolean(uploading)}>{loading ? "正在保存…" : project.status === "published" ? "发布项目" : "保存草稿"}</button></aside>
    </form>
  </section>
}
