import Link from "next/link"
export default function Posts() { return <main className="post-page"><header><Link href="/" className="mark">PL.</Link><Link href="/">← 首页</Link></header><section className="prose"><p className="eyebrow">文章档案</p><h1>慢慢写，持续更新。</h1><p>文章详情通过 Hono API 读取；首页展示的示例文章已经可以直接打开。</p><Link className="arrow-link" href="/posts/designing-for-calm">阅读最新文章 →</Link></section></main> }
