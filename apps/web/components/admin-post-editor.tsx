"use client"

import { FormEvent, useRef } from "react"
import { Markdown } from "./markdown"

type Status = "draft" | "hidden" | "published"
type Post = { id?: number; title: string; slug: string; excerpt: string; content: string; tags: string[]; status: Status; pinned: boolean; publishedAt: string | null }
type Props = { post: Post; setPost: (post: Post) => void; preview: boolean; setPreview: (value: boolean) => void; back: () => void; save: (event: FormEvent) => void; loading: boolean }

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const toLocalTime = (date: string | null) => date ? new Date(new Date(date).getTime() - new Date(date).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""

export function PostEditor({ post, setPost, preview, setPreview, back, save, loading }: Props) {
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const words = post.content.trim() ? post.content.trim().split(/\s+/).length : 0
  const insert = (before: string, after = "", fallback = "文字") => {
    const field = contentRef.current
    const start = field?.selectionStart ?? post.content.length
    const end = field?.selectionEnd ?? start
    const selected = post.content.slice(start, end) || fallback
    setPost({ ...post, content: `${post.content.slice(0, start)}${before}${selected}${after}${post.content.slice(end)}` })
    requestAnimationFrame(() => { field?.focus(); field?.setSelectionRange(start + before.length, start + before.length + selected.length) })
  }
  return <section className="editor-shell"><div className="writer-header"><button type="button" className="back-button" onClick={back}>← 所有文章</button><div><span className={`writer-status ${post.status}`}>{post.status === "published" ? "已发布" : post.status === "hidden" ? "隐藏" : "草稿"}</span><span className="writer-count">{words} 词 · 预计 {Math.max(1, Math.ceil(words / 250))} 分钟阅读</span></div></div><form className="editor writer-layout" onSubmit={save}><div className="editor-main writer-canvas"><input className="title-input" placeholder="给文章起一个标题" value={post.title} onChange={(event) => setPost({ ...post, title: event.target.value, slug: post.slug || slugify(event.target.value) })} /><div className="slug-field"><span>blog.michikatsu.top/posts/</span><input placeholder="article-slug" value={post.slug} onChange={(event) => setPost({ ...post, slug: slugify(event.target.value) })} /></div><textarea className="excerpt-input" placeholder="摘要：列表页会展示这一小段内容" value={post.excerpt} onChange={(event) => setPost({ ...post, excerpt: event.target.value })} /><div className="content-header"><span>正文</span><button type="button" className="preview-button" onClick={() => setPreview(!preview)}>{preview ? "返回编辑" : "阅读预览"}</button></div>{preview ? <div className="markdown-preview"><Markdown content={post.content || "# 预览\n\n开始写作后，内容会显示在这里。"} /></div> : <><div className="markdown-toolbar"><button type="button" onClick={() => insert("# ", "", "标题")}>H1</button><button type="button" onClick={() => insert("## ", "", "小标题")}>H2</button><button type="button" onClick={() => insert("**", "**", "加粗文字")}>B</button><button type="button" onClick={() => insert("[", "](https://)", "链接文字")}>链接</button><button type="button" onClick={() => insert("> ", "", "引用")}>引用</button><button type="button" onClick={() => insert("`", "`", "代码")}>代码</button></div><textarea ref={contentRef} className="content writer-content" placeholder="从这里开始写作…" value={post.content} onChange={(event) => setPost({ ...post, content: event.target.value })} /></>}</div><aside className="publish-panel"><h2>发布设置</h2><label>状态<select value={post.status} onChange={(event) => setPost({ ...post, status: event.target.value as Status })}><option value="draft">草稿</option><option value="published">发布</option><option value="hidden">隐藏</option></select></label><label className="pin-toggle"><input type="checkbox" checked={post.pinned} onChange={(event) => setPost({ ...post, pinned: event.target.checked })} /><span><b>置顶文章</b><small>可同时置顶多篇，前台优先展示</small></span></label><label>发布时间<input type="datetime-local" value={toLocalTime(post.publishedAt)} onChange={(event) => setPost({ ...post, publishedAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label><label>标签<input placeholder="例如：设计, 技术" value={post.tags.join(", ")} onChange={(event) => setPost({ ...post, tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><button disabled={loading}>{loading ? "正在保存…" : post.status === "published" ? "发布文章" : "保存草稿"}</button></aside></form></section>
}
