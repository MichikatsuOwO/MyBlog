"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { Markdown } from "../../components/markdown"

const api = process.env.NEXT_PUBLIC_API_URL || "/api"

type Status = "draft" | "hidden" | "published"
type Post = {
  id?: number
  title: string
  slug: string
  excerpt: string
  content: string
  tags: string[]
  status: Status
  publishedAt: string | null
}

const emptyPost = (): Post => ({ title: "", slug: "", excerpt: "", content: "", tags: [], status: "draft", publishedAt: null })
const statusLabel: Record<Status, string> = { draft: "草稿", hidden: "隐藏", published: "已发布" }

function toLocalDateTime(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatDate(value: string | null) {
  if (!value) return "未设置"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "未设置" : date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })
}

export default function Admin() {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [post, setPost] = useState<Post>(emptyPost)
  const [screen, setScreen] = useState<"list" | "editor">("list")
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState("")

  const loadPosts = async (accessToken = token) => {
    if (!accessToken) return
    setLoading(true)
    const response = await fetch(`${api}/admin/posts`, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (response.ok) setPosts(await response.json())
    else if (response.status === 401) {
      sessionStorage.removeItem("blog-admin-token")
      setToken("")
      setNotice("登录已过期，请重新登录。")
    } else setNotice("文章列表加载失败，请稍后重试。")
    setLoading(false)
  }

  useEffect(() => {
    const savedToken = sessionStorage.getItem("blog-admin-token")
    if (savedToken) {
      setToken(savedToken)
      void loadPosts(savedToken)
    }
  }, [])

  const metrics = useMemo(() => ({
    all: posts.length,
    published: posts.filter((item) => item.status === "published").length,
    draft: posts.filter((item) => item.status === "draft").length,
  }), [posts])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setNotice("")
    const response = await fetch(`${api}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) })
    if (!response.ok) return setNotice("密码不正确，请重试。")
    const result = await response.json()
    sessionStorage.setItem("blog-admin-token", result.token)
    setToken(result.token)
    setPassword("")
    void loadPosts(result.token)
  }

  const createPost = () => {
    setPost(emptyPost())
    setPreview(false)
    setNotice("")
    setScreen("editor")
  }

  const editPost = (item: Post) => {
    setPost({ ...item, tags: item.tags || [] })
    setPreview(false)
    setNotice("")
    setScreen("editor")
  }

  const savePost = async (event: FormEvent) => {
    event.preventDefault()
    if (!post.title.trim() || !post.slug.trim()) return setNotice("请先填写文章标题和 URL 标识（slug）。")
    setLoading(true)
    const response = await fetch(`${api}/admin/posts${post.id ? `/${post.id}` : ""}`, {
      method: post.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(post),
    })
    setLoading(false)
    if (!response.ok) {
      const result = await response.json().catch(() => null)
      return setNotice(result?.message || "保存失败，请检查 slug 是否只包含英文小写字母、数字和连字符。")
    }
    setNotice(post.status === "published" ? "文章已发布。" : "草稿已保存。")
    await loadPosts()
    setScreen("list")
  }

  const deletePost = async (item: Post) => {
    if (!item.id || !window.confirm(`确定删除《${item.title}》吗？此操作不可恢复。`)) return
    setLoading(true)
    const response = await fetch(`${api}/admin/posts/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
    setLoading(false)
    if (!response.ok) return setNotice("删除失败，请稍后重试。")
    setNotice("文章已删除。")
    await loadPosts()
  }

  const logout = () => {
    sessionStorage.removeItem("blog-admin-token")
    setToken("")
    setPosts([])
    setNotice("")
  }

  if (!token) return <main className="admin login-page"><form className="login" onSubmit={login}><span className="eyebrow">MICHIKATSU / ADMIN</span><h1>内容管理</h1><p>登录后管理文章、草稿和发布状态。</p><label>管理密码<input type="password" autoFocus placeholder="输入密码" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button>进入后台</button>{notice && <p className="notice error">{notice}</p>}</form></main>

  return <main className="admin">
    <header className="admin-header">
      <div><span className="eyebrow">MICHIKATSU / CONTENT</span><h1>文章管理</h1></div>
      <div className="header-actions"><a href="/" target="_blank" rel="noreferrer">查看网站 ↗</a><button className="text-button" onClick={logout}>退出</button><button onClick={createPost}>+ 新建文章</button></div>
    </header>

    {notice && <div className="notice">{notice}<button className="dismiss" onClick={() => setNotice("")}>×</button></div>}

    {screen === "list" ? <>
      <section className="metrics" aria-label="文章统计">
        <div><span>全部文章</span><strong>{metrics.all}</strong></div><div><span>已发布</span><strong>{metrics.published}</strong></div><div><span>草稿</span><strong>{metrics.draft}</strong></div>
      </section>
      <section className="post-panel">
        <div className="panel-heading"><div><h2>所有文章</h2><p>在这里管理内容，点击文章即可继续编辑。</p></div><button onClick={createPost}>新建文章</button></div>
        {loading ? <div className="empty-admin">正在加载文章…</div> : posts.length === 0 ? <div className="empty-admin"><div className="empty-icon">✦</div><h3>还没有文章</h3><p>从第一篇开始吧。草稿只有你能看到，发布后会出现在博客首页。</p><button onClick={createPost}>写第一篇文章</button></div> : <div className="post-table">
          <div className="table-head"><span>文章</span><span>状态</span><span>发布日期</span><span>操作</span></div>
          {posts.map((item) => <article className="post-row" key={item.id}><div><button className="post-title" onClick={() => editPost(item)}>{item.title || "未命名文章"}</button><p>/{item.slug} · {item.excerpt || "暂无摘要"}</p></div><span className={`status ${item.status}`}>{statusLabel[item.status]}</span><time>{formatDate(item.publishedAt)}</time><div className="row-actions"><button className="text-button" onClick={() => editPost(item)}>编辑</button><button className="danger-button" onClick={() => deletePost(item)}>删除</button></div></article>)}
        </div>}
      </section>
    </> : <section className="editor-shell">
      <div className="editor-top"><button className="back-button" onClick={() => { setScreen("list"); setNotice("") }}>← 返回文章列表</button><span>{post.id ? "编辑文章" : "新建文章"}</span></div>
      <form className="editor" onSubmit={savePost}>
        <div className="editor-main"><input className="title-input" placeholder="文章标题" value={post.title} onChange={(event) => setPost({ ...post, title: event.target.value })} /><div className="slug-field"><span>blog.michikatsu.top/posts/</span><input aria-label="URL 标识" placeholder="article-slug" value={post.slug} onChange={(event) => setPost({ ...post, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div><textarea className="excerpt-input" placeholder="给读者的一句话摘要（可选）" value={post.excerpt} onChange={(event) => setPost({ ...post, excerpt: event.target.value })} />
          <div className="content-header"><span>正文（Markdown）</span><button type="button" className="text-button" onClick={() => setPreview(!preview)}>{preview ? "继续编辑" : "预览文章"}</button></div>
          {preview ? <div className="markdown-preview"><Markdown content={post.content || "# 预览\n\n开始写作后，内容会显示在这里。"} /></div> : <textarea className="content" placeholder={'# 开始写作\n\n支持 **加粗**、`代码`、[链接](https://example.com) 和图片。'} value={post.content} onChange={(event) => setPost({ ...post, content: event.target.value })} />}
        </div>
        <aside className="publish-panel"><h2>发布设置</h2><label>状态<select value={post.status} onChange={(event) => setPost({ ...post, status: event.target.value as Status })}><option value="draft">草稿</option><option value="published">发布</option><option value="hidden">隐藏</option></select></label><label>发布时间<input type="datetime-local" value={toLocalDateTime(post.publishedAt)} onChange={(event) => setPost({ ...post, publishedAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label><label>标签<input placeholder="例如：随笔, 技术, 日常" value={post.tags.join(", ")} onChange={(event) => setPost({ ...post, tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><button disabled={loading}>{loading ? "正在保存…" : post.status === "published" ? "发布文章" : "保存草稿"}</button><p>发布时请设置发布时间；留空的文章不会展示在首页。</p></aside>
      </form>
    </section>}
  </main>
}
