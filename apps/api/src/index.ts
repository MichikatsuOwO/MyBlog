import { serve } from "@hono/node-server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { zValidator } from "@hono/zod-validator"
import { z } from "zod"
import postgres from "postgres"
import { createHmac, timingSafeEqual } from "node:crypto"

const app = new Hono()
const sql = process.env.POSTGRES_URL ? postgres(process.env.POSTGRES_URL) : null
const postSchema = z.object({
  title: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9-]+$/), excerpt: z.string().default(""), content: z.string().default(""), tags: z.array(z.string()).default([]), status: z.enum(["draft", "hidden", "published"]), publishedAt: z.string().nullable(),
})
const projectSchema = z.object({
  title: z.string().min(1), slug: z.string().min(1).regex(/^[a-z0-9-]+$/), description: z.string().default(""), tags: z.array(z.string()).default([]), url: z.string().url().or(z.literal("")), status: z.enum(["draft", "hidden", "published"]),
})
const siteSchema = z.object({
  displayName: z.string().max(80).default(""), handle: z.string().max(80).default(""), avatarUrl: z.string().url().or(z.literal("")), homeIntro: z.string().max(240).default(""), aboutTitle: z.string().max(120).default(""), aboutContent: z.string().max(12000).default(""), links: z.array(z.object({ label: z.string().min(1).max(40), url: z.string().url() })).max(8).default([]),
})
const sign = (value: string) => createHmac("sha256", process.env.ADMIN_TOKEN_SECRET || "dev-only-secret").update(value).digest("hex")
const authenticated = (c: any) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")
  if (!token) return false
  const [value, hash] = token.split(".")
  if (!value || !hash) return false
  const expected = Buffer.from(sign(value)), received = Buffer.from(hash)
  return expected.length === received.length && timingSafeEqual(expected, received) && Number(value) > Date.now()
}

if (sql) {
  await sql`create table if not exists posts (id serial primary key, title text not null, slug text unique not null, excerpt text not null default '', content text not null default '', tags text[] not null default '{}', status text not null default 'draft', published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`
  await sql`create table if not exists projects (id serial primary key, title text not null, slug text unique not null, description text not null default '', tags text[] not null default '{}', url text not null default '', status text not null default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now())`
  await sql`alter table projects add column if not exists url text not null default ''`
  await sql`create table if not exists site_profile (id smallint primary key default 1 check (id = 1), display_name text not null default '', handle text not null default '', avatar_url text not null default '', home_intro text not null default '', about_title text not null default '', about_content text not null default '', links jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now())`
}

app.use("/*", cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000" }))
app.get("/health", (c) => c.json({ ok: true }))
app.get("/posts", async (c) => c.json(sql ? await sql`select slug, title, excerpt, tags, published_at as date from posts where status = 'published' and published_at <= now() order by published_at desc` : []))
app.get("/posts/:slug", async (c) => {
  if (!sql) return c.json({ message: "Not found" }, 404)
  const [post] = await sql`select title, published_at as date, tags, content as body from posts where slug = ${c.req.param("slug")} and status = 'published' and published_at <= now()`
  return post ? c.json({ ...post, minutes: Math.max(1, Math.ceil(post.body.length / 500)) }) : c.json({ message: "Not found" }, 404)
})
app.get("/projects", async (c) => c.json(sql ? await sql`select slug, title, description, tags, url from projects where status = 'published' order by created_at desc` : []))
app.get("/site", async (c) => {
  if (!sql) return c.json({ displayName: "", handle: "", avatarUrl: "", homeIntro: "", aboutTitle: "", aboutContent: "", links: [] })
  const [site] = await sql`select display_name as "displayName", handle, avatar_url as "avatarUrl", home_intro as "homeIntro", about_title as "aboutTitle", about_content as "aboutContent", links from site_profile where id = 1`
  return c.json(site || { displayName: "", handle: "", avatarUrl: "", homeIntro: "", aboutTitle: "", aboutContent: "", links: [] })
})
app.post("/admin/login", zValidator("json", z.object({ password: z.string() })), (c) => {
  if (!process.env.ADMIN_PASSWORD || c.req.valid("json").password !== process.env.ADMIN_PASSWORD) return c.json({ message: "Invalid password" }, 401)
  const value = String(Date.now() + 7 * 86400000)
  return c.json({ token: `${value}.${sign(value)}` })
})
app.get("/admin/posts", async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  return c.json(sql ? await sql`select id, title, slug, excerpt, content, tags, status, published_at as "publishedAt" from posts order by updated_at desc` : [])
})
app.get("/admin/projects", async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  return c.json(sql ? await sql`select id, title, slug, description, tags, url, status from projects order by updated_at desc` : [])
})
app.post("/admin/projects", zValidator("json", projectSchema), async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  const project = c.req.valid("json")
  const [row] = await sql`insert into projects ${sql(project)} returning id`
  return c.json(row, 201)
})
app.put("/admin/projects/:id", zValidator("json", projectSchema), async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  const project = c.req.valid("json")
  await sql`update projects set title = ${project.title}, slug = ${project.slug}, description = ${project.description}, tags = ${project.tags}, url = ${project.url}, status = ${project.status}, updated_at = now() where id = ${Number(c.req.param("id"))}`
  return c.json({ ok: true })
})
app.delete("/admin/projects/:id", async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  await sql`delete from projects where id = ${Number(c.req.param("id"))}`
  return c.json({ ok: true })
})
app.get("/admin/site", async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ displayName: "", handle: "", avatarUrl: "", homeIntro: "", aboutTitle: "", aboutContent: "", links: [] })
  const [site] = await sql`select display_name as "displayName", handle, avatar_url as "avatarUrl", home_intro as "homeIntro", about_title as "aboutTitle", about_content as "aboutContent", links from site_profile where id = 1`
  return c.json(site || { displayName: "", handle: "", avatarUrl: "", homeIntro: "", aboutTitle: "", aboutContent: "", links: [] })
})
app.put("/admin/site", zValidator("json", siteSchema), async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  const site = c.req.valid("json")
  await sql`insert into site_profile ${sql({ id: 1, display_name: site.displayName, handle: site.handle, avatar_url: site.avatarUrl, home_intro: site.homeIntro, about_title: site.aboutTitle, about_content: site.aboutContent, links: sql.json(site.links) })} on conflict (id) do update set display_name = excluded.display_name, handle = excluded.handle, avatar_url = excluded.avatar_url, home_intro = excluded.home_intro, about_title = excluded.about_title, about_content = excluded.about_content, links = excluded.links, updated_at = now()`
  return c.json({ ok: true })
})
app.post("/admin/posts", zValidator("json", postSchema), async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  const post = c.req.valid("json")
  const [row] = await sql`insert into posts ${sql({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, tags: post.tags, status: post.status, published_at: post.publishedAt })} returning id`
  return c.json(row, 201)
})
app.put("/admin/posts/:id", zValidator("json", postSchema), async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  const post = c.req.valid("json")
  await sql`update posts set title = ${post.title}, slug = ${post.slug}, excerpt = ${post.excerpt}, content = ${post.content}, tags = ${post.tags}, status = ${post.status}, published_at = ${post.publishedAt}, updated_at = now() where id = ${Number(c.req.param("id"))}`
  return c.json({ ok: true })
})
app.delete("/admin/posts/:id", async (c) => {
  if (!authenticated(c)) return c.json({ message: "Unauthorized" }, 401)
  if (!sql) return c.json({ message: "Database not configured" }, 503)
  await sql`delete from posts where id = ${Number(c.req.param("id"))}`
  return c.json({ ok: true })
})

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
