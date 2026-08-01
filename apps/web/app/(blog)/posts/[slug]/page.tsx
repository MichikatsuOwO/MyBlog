import { notFound } from "next/navigation"
import { PostReader } from "../../../../components/post-reader"
const API = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8788"
type Post = { title:string; date:string; tags:string[]; minutes:number; body:string }
async function getPost(slug: string): Promise<Post | null> { try { const r = await fetch(`${API}/posts/${slug}`, { cache: "no-store" }); return r.ok ? r.json() : null } catch { return null } }
export default async function PostPage({ params }: { params: Promise<{slug:string}> }) { const post = await getPost((await params).slug); if (!post) notFound(); return <PostReader post={post} /> }
