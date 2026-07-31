import Link from "next/link"
import { notFound } from "next/navigation"
import { Markdown } from "../../../../components/markdown"
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"
type Post = { title:string; date:string; tags:string[]; minutes:number; body:string }
async function getPost(slug: string): Promise<Post | null> { try { const r = await fetch(`${API}/posts/${slug}`, { next: { revalidate: 60 } }); return r.ok ? r.json() : null } catch { return null } }
export default async function PostPage({ params }: { params: Promise<{slug:string}> }) { const post = await getPost((await params).slug); if (!post) notFound(); return <main className="post-page"><header><Link href="/" className="mark">PL.</Link><Link href="/posts">← 所有文章</Link></header><article className="prose"><p className="eyebrow">{post.tags.join(" · ")} / {post.minutes} 分钟阅读</p><h1>{post.title}</h1><time>{post.date}</time><Markdown content={post.body}/></article></main> }
