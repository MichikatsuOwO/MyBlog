import { serve } from "@hono/node-server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import { posts, projects } from "@paperlane/content"
import postgres from "postgres"
import { createHmac, timingSafeEqual } from "node:crypto"

const app = new Hono()
const sql = process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL) : null
const schema = z.object({ title:z.string().min(1), slug:z.string().min(1).regex(/^[a-z0-9-]+$/), excerpt:z.string().default(""), content:z.string().default(""), tags:z.array(z.string()).default([]), status:z.enum(["draft","hidden","published"]), publishedAt:z.string().nullable() })
const sign = (value:string) => createHmac("sha256", process.env.ADMIN_TOKEN_SECRET || "dev-only-secret").update(value).digest("hex")
const authenticated = (c: any) => { const token=c.req.header("Authorization")?.replace("Bearer ",""); if(!token) return false; const [value,hash]=token.split("."); if(!value||!hash||!timingSafeEqual(Buffer.from(sign(value)),Buffer.from(hash))) return false; return Number(value)>Date.now() }
if (sql) await sql`create table if not exists posts (id serial primary key,title text not null,slug text unique not null,excerpt text not null default '',content text not null default '',tags text[] not null default '{}',status text not null default 'draft',published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now())`
app.use("/*", cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }))
app.get("/health", (c) => c.json({ ok: true }))
app.get("/posts", async (c) => { if(!sql) return c.json(posts.map(({ body, ...post }) => post)); return c.json(await sql`select slug,title,excerpt,tags,published_at as date from posts where status='published' and published_at <= now() order by published_at desc`) })
app.get("/posts/:slug", (c) => { const post = posts.find((item) => item.slug === c.req.param("slug")); return post ? c.json(post) : c.json({ message: "Not found" }, 404) })
app.get("/projects", (c) => c.json(projects))
app.post("/admin/login", zValidator("json", z.object({password:z.string()})), (c) => { const pass=c.req.valid("json").password; if(!process.env.ADMIN_PASSWORD || pass !== process.env.ADMIN_PASSWORD) return c.json({message:"Invalid password"},401); const value=String(Date.now()+7*86400000); return c.json({token:`${value}.${sign(value)}`}) })
app.get("/admin/posts", async c => { if(!authenticated(c)) return c.json({message:"Unauthorized"},401); if(!sql) return c.json([]); return c.json(await sql`select id,title,slug,excerpt,content,tags,status,published_at as "publishedAt" from posts order by updated_at desc`) })
app.post("/admin/posts", zValidator("json", schema), async c => { if(!authenticated(c)) return c.json({message:"Unauthorized"},401); if(!sql) return c.json({message:"Database not configured"},503); const p=c.req.valid("json"); const [row]=await sql`insert into posts ${sql({title:p.title,slug:p.slug,excerpt:p.excerpt,content:p.content,tags:p.tags,status:p.status,published_at:p.publishedAt})} returning id`; return c.json(row,201) })
app.put("/admin/posts/:id", zValidator("json", schema), async c => { if(!authenticated(c)) return c.json({message:"Unauthorized"},401); if(!sql) return c.json({message:"Database not configured"},503); const p=c.req.valid("json"); await sql`update posts set title=${p.title},slug=${p.slug},excerpt=${p.excerpt},content=${p.content},tags=${p.tags},status=${p.status},published_at=${p.publishedAt},updated_at=now() where id=${Number(c.req.param("id"))}`; return c.json({ok:true}) })

const uploadSchema = z.object({ filename: z.string().min(1).max(120), contentType: z.string().regex(/^image\//) })
app.post("/uploads/presign", zValidator("json", uploadSchema), async (c) => {
  const { filename, contentType } = c.req.valid("json")
  const required = ["S3_BUCKET", "S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]
  if (required.some((key) => !process.env[key])) return c.json({ message: "OSS is not configured" }, 503)
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`
  const client = new S3Client({ region: process.env.S3_REGION || "us-east-1", endpoint: process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! }, forcePathStyle: false })
  const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 })
  const publicBase = (process.env.S3_PUBLIC_BASE_URL || process.env.S3_ENDPOINT!).replace(/\/$/, "")
  return c.json({ key, uploadUrl, publicUrl: `${publicBase}/${key}`, expiresIn: 300 })
})
serve({ fetch: app.fetch, port: Number(process.env.PORT || 8787) })
