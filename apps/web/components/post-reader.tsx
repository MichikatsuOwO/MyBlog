"use client"

import Link from "next/link"
import { CSSProperties, useMemo, useState } from "react"
import { Markdown } from "./markdown"

type Post = { title: string; date: string; tags: string[]; minutes: number; body: string }

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Shanghai" }).format(date)
}

export function PostReader({ post }: { post: Post }) {
  const [light, setLight] = useState(true)
  const [serif, setSerif] = useState(true)
  const [fontSize, setFontSize] = useState(18)
  const [settings, setSettings] = useState(false)
  const style = useMemo(() => ({ "--reader-size": `${fontSize}px` }) as CSSProperties, [fontSize])

  return <div className={`reader-site ${light ? "light" : "dark"} ${serif ? "reader-serif" : "reader-sans"}`} style={style}>
    <header className="reader-header">
      <Link href="/" className="reader-brand">M.</Link>
      <Link href="/" className="reader-back">← 返回博客</Link>
      <button className="reader-settings-trigger" type="button" onClick={() => setSettings(!settings)} aria-expanded={settings}>阅读设置</button>
    </header>
    {settings && <section className="reader-settings" aria-label="阅读设置">
      <div className="reader-setting"><span>阅读主题</span><div className="reader-segment"><button className={light ? "active" : ""} onClick={() => setLight(true)}>纸白</button><button className={!light ? "active" : ""} onClick={() => setLight(false)}>夜读</button></div></div>
      <div className="reader-setting"><span>正文字体</span><div className="reader-segment"><button className={serif ? "active" : ""} onClick={() => setSerif(true)}>衬线</button><button className={!serif ? "active" : ""} onClick={() => setSerif(false)}>无衬线</button></div></div>
      <label className="reader-range"><span>字号</span><input type="range" min="16" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} /><b>{fontSize}px</b></label>
    </section>}
    <main className="reader-main">
      <article className="reader-article">
        <div className="reader-kicker">{post.tags.length ? post.tags.join(" · ") : "文章"}</div>
        <h1>{post.title}</h1>
        <div className="reader-meta"><time dateTime={post.date}>{formatDate(post.date)}</time><span>·</span><span>{post.minutes} 分钟阅读</span></div>
        <div className="reader-rule" />
        <Markdown content={post.body} />
      </article>
    </main>
  </div>
}
