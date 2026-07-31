import { readFile } from "node:fs/promises"
import postgres from "postgres"

const legacyPosts = [
  {
    title: "OUC_CSer自学指南",
    source: "hexo",
    url: "https://loveanneliser.github.io/2023/09/04/OUC-CSer%E8%87%AA%E5%AD%A6%E6%8C%87%E5%8D%97/",
    slug: "ouc-cser-study-guide",
    excerpt: "面向计算机专业学生的自学路线：从基础课程到系统、网络、数据库与分布式。",
    tags: ["学习路线", "计算机基础", "CS"],
    publishedAt: "2023-09-04T12:00:00+08:00",
  },
  {
    title: "从 Demo 到生产：Tool Calling 最容易踩的 7 个坑",
    source: "wordpress",
    slug: "production-tool-calling-pitfalls",
    excerpt: "从真实工程落地出发，梳理 Tool Calling 在生产环境中最常见的七类问题与应对思路。",
    tags: ["AI", "Agent", "Tool Calling", "工程实践"],
    publishedAt: "2026-04-07T12:00:00+08:00",
  },
  {
    title: "从零开始调试 Canal：一个真实的踩坑记录",
    source: "wordpress",
    slug: "debugging-canal-from-zero",
    excerpt: "记录在 Windows 环境参与 Canal 开源项目、编译和调试时遇到的真实问题与解决过程。",
    tags: ["Canal", "开源", "调试", "中间件"],
    publishedAt: "2026-03-09T12:00:00+08:00",
  },
  {
    title: "一个 Shopify 商品页能打开，但 PageSpeed 跑不出来，这说明了什么？",
    source: "wordpress",
    slug: "shopify-pagespeed-audit",
    excerpt: "从一次 Shopify 商品页审计出发，分析页面可访问却无法稳定完成性能分析背后的复杂度问题。",
    tags: ["Shopify", "性能优化", "Lighthouse", "项目复盘"],
    publishedAt: "2026-06-11T12:00:00+08:00",
  },
  {
    title: "一个非典型 985 计算机毕业生的开局",
    source: "wordpress",
    slug: "an-atypical-cs-graduate-start",
    excerpt: "从错过校招到转向 AI：一名计算机毕业生重新选择职业路径的记录。",
    tags: ["成长", "职业", "AI"],
    publishedAt: "2026-05-13T12:00:00+08:00",
  },
]

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

function htmlToMarkdown(html) {
  const blocks = []
  const stash = (content) => `@@BLOCK_${blocks.push(content) - 1}@@`
  let text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
    .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => stash(`\n\n\`\`\`\n${decodeHtml(code).trim()}\n\`\`\`\n\n`))
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, "![$2]($1)")
    .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi, "![$1]($2)")
    .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, "![]($1)")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => `[${decodeHtml(label.replace(/<[^>]+>/g, "")).trim() || href}](${href})`)
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => `\n\n${"#".repeat(Number(level))} ${decodeHtml(content.replace(/<[^>]+>/g, "")).trim()}\n\n`)
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => `\n- ${content}`)
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => `\n\n> ${content.replace(/<[^>]+>/g, "").trim()}\n\n`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|figure|figcaption|ul|ol|table|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")

  text = decodeHtml(text)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text.replace(/@@BLOCK_(\d+)@@/g, (_, index) => blocks[Number(index)]).replace(/\n{3,}/g, "\n\n").trim()
}

async function fetchWordPressPost(title) {
  const response = await fetch("https://michikatsu.top/wp-json/wp/v2/posts?per_page=20")
  if (!response.ok) throw new Error(`无法读取 WordPress 文章：${response.status}`)
  const posts = await response.json()
  const post = posts.find((item) => decodeHtml(item.title.rendered.replace(/<[^>]+>/g, "")) === title)
  if (!post) throw new Error(`未找到 WordPress 文章：${title}`)
  return htmlToMarkdown(post.content.rendered)
}

async function fetchHexoPost(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`无法读取 Hexo 文章：${response.status}`)
  const page = await response.text()
  const match = page.match(/<div class="post-body[^>]*>([\s\S]*?)<\/article>/i)
  if (!match) throw new Error("未能识别 Hexo 正文区域")
  return htmlToMarkdown(match[1])
}

async function loadEnv() {
  const content = await readFile(new URL("../.env", import.meta.url), "utf8")
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

await loadEnv()

const prepared = []
for (const post of legacyPosts) {
  const content = post.source === "wordpress" ? await fetchWordPressPost(post.title) : await fetchHexoPost(post.url)
  if (content.length < 200) throw new Error(`文章内容异常短，已停止导入：${post.title}`)
  prepared.push({ ...post, content })
}

if (process.argv.includes("--dry-run")) {
  for (const post of prepared) console.log(`${post.publishedAt.slice(0, 10)}  ${post.title}（${post.content.length} 字符）`)
  process.exit(0)
}

async function importWithDatabase() {
  const sql = postgres(process.env.POSTGRES_URL)
  try {
    for (const post of prepared) {
      await sql`
        insert into posts ${sql({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, tags: post.tags, status: "published", published_at: post.publishedAt })}
        on conflict (slug) do update set
          title = excluded.title,
          excerpt = excluded.excerpt,
          content = excluded.content,
          tags = excluded.tags,
          status = excluded.status,
          published_at = excluded.published_at,
          updated_at = now()
      `
      console.log(`已导入：${post.title}（${post.publishedAt.slice(0, 10)}）`)
    }
  } finally {
    await sql.end()
  }
}

async function importWithAdminApi() {
  const api = (process.env.MIGRATION_API_URL || "https://blog.michikatsu.top/api").replace(/\/$/, "")
  if (!process.env.ADMIN_PASSWORD) throw new Error("未配置 ADMIN_PASSWORD，无法通过后台接口导入")
  const login = await fetch(`${api}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) })
  if (!login.ok) throw new Error(`后台登录失败：${login.status}`)
  const { token } = await login.json()
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  const existingResponse = await fetch(`${api}/admin/posts`, { headers })
  if (!existingResponse.ok) throw new Error(`无法读取已有文章：${existingResponse.status}`)
  const existing = await existingResponse.json()
  const ids = new Map(existing.map((post) => [post.slug, post.id]))

  for (const post of prepared) {
    const id = ids.get(post.slug)
    const response = await fetch(`${api}/admin/posts${id ? `/${id}` : ""}`, {
      method: id ? "PUT" : "POST",
      headers,
      body: JSON.stringify({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.content, tags: post.tags, status: "published", publishedAt: post.publishedAt }),
    })
    if (!response.ok) throw new Error(`导入失败：${post.title}（${response.status}）`)
    console.log(`${id ? "已更新" : "已导入"}：${post.title}（${post.publishedAt.slice(0, 10)}）`)
  }
}

if (process.env.POSTGRES_URL) {
  await importWithDatabase()
} else {
  await importWithAdminApi()
}
