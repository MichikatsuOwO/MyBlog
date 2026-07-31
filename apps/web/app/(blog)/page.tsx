"use client"

import Link from "next/link"
import { CSSProperties, useEffect, useState } from "react"

const api = process.env.NEXT_PUBLIC_API_URL || "/api"
type Post = { slug: string; title: string; excerpt: string; tags: string[]; date: string | null }
type Project = { slug: string; title: string; description: string; tags: string[] }

export default function Home() {
  const [light, setLight] = useState(false), [view, setView] = useState("Home"), [settings, setSettings] = useState(false), [radius, setRadius] = useState(22), [serif, setSerif] = useState(false), [shadow, setShadow] = useState(true), [accent, setAccent] = useState("#9bf443")
  const [posts, setPosts] = useState<Post[]>([]), [projects, setProjects] = useState<Project[]>([])
  const style = { "--radius": `${radius}px`, "--accent": accent } as CSSProperties

  useEffect(() => { void Promise.all([fetch(`${api}/posts`).then((response) => response.ok ? response.json() : []), fetch(`${api}/projects`).then((response) => response.ok ? response.json() : [])]).then(([nextPosts, nextProjects]) => { setPosts(nextPosts); setProjects(nextProjects) }) }, [])

  return <div className={`site soft ${light ? "light" : ""} ${serif ? "serif" : ""} ${shadow ? "soft-shadow" : ""}`} style={style}>
    <aside><section className="profile-card"><div className="profile-avatar">M</div><h1>Michikatsu</h1><p>@MichikatsuOwO</p><div className="profile-stats"><div><b>{posts.length}</b><span>文章</span></div><div><b>{projects.length}</b><span>项目</span></div></div><div className="profile-links"><a href="https://github.com/MichikatsuOwO" target="_blank" rel="noreferrer">GitHub <span>↗</span></a></div></section><nav className="primary-nav">{["Home", "About", "Projects", "Blog"].map((item) => <button className={view === item ? "selected" : ""} onClick={() => setView(item)} key={item}><i>·</i>{item}</button>)}</nav><div className="side-footer">© 2026</div></aside>
    <main>{view === "Home" ? <HomeView posts={posts} /> : view === "Projects" ? <Projects projects={projects} /> : view === "Blog" ? <Blog posts={posts} /> : <About />}</main>
    <button className="settings-trigger" onClick={() => setSettings(!settings)} aria-label="Open appearance settings">⚙</button>
    {settings && <section className="settings-panel"><button className="close-settings" onClick={() => setSettings(false)}>×</button><h3>Appearance</h3><label className="setting-line">Night mode <button className="switch" onClick={() => setLight(!light)}><i className={light ? "on" : ""}/></button></label><label className="setting-line">Typeface <span className="segmented"><button className={!serif ? "active" : ""} onClick={() => setSerif(false)}>Sans</button><button className={serif ? "active" : ""} onClick={() => setSerif(true)}>Serif</button></span></label><label className="setting-line">Shadow <button className="switch" onClick={() => setShadow(!shadow)}><i className={shadow ? "on" : ""}/></button></label><label className="setting-line color-line">Accent <span>{["#9bf443", "#4bb8ff", "#e4a2d5", "#d7a36b"].map((color) => <button aria-label={`Use ${color}`} className={accent === color ? "chosen" : ""} style={{ background: color }} onClick={() => setAccent(color)} key={color}/>)}</span></label><label className="radius-label">Roundness <input type="range" min="12" max="40" value={radius} onChange={(event) => setRadius(Number(event.target.value))}/></label></section>}
  </div>
}

function HomeView({ posts }: { posts: Post[] }) { return <><section className="title"><h2>Home</h2><p>记录正在发生的事情。</p></section><section className="list">{posts.length ? posts.slice(0, 5).map((post, index) => <Link className="list-row" href={`/posts/${post.slug}`} key={post.slug}><span>{String(index + 1).padStart(2, "0")}</span><strong>{post.title}</strong><b>↗</b></Link>) : <p className="empty-state">还没有已发布的文章。请前往后台创建第一篇。</p>}</section></> }
function Projects({ projects }: { projects: Project[] }) { return <><section className="title"><h2>Projects</h2><p>项目会在发布后显示在这里。</p></section>{projects.length ? <section className="grid">{projects.map((project) => <article className="card" key={project.slug}><div className="card-body"><h3>{project.title}</h3><p>{project.description}</p><div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>)}</section> : <p className="empty-state">还没有已发布的项目。</p>}</> }
function Blog({ posts }: { posts: Post[] }) { return <><section className="title"><h2>Blog</h2><p>所有已发布文章都来自数据库。</p></section><section className="list">{posts.length ? posts.map((post, index) => <Link className="list-row" href={`/posts/${post.slug}`} key={post.slug}><span>{String(index + 1).padStart(2, "0")}</span><strong>{post.title}</strong><b>↗</b></Link>) : <p className="empty-state">还没有已发布的文章。</p>}</section></> }
function About() { return <><section className="title"><h2>About</h2><p>个人介绍将在准备好后发布。</p></section><p className="empty-state">暂未添加介绍内容。</p></> }
