import Link from "next/link"

export default function Posts() { return <main className="post-page"><header><Link href="/" className="mark">PL.</Link><Link href="/">← 首页</Link></header><section className="prose"><p className="eyebrow">文章</p><h1>文章列表</h1><p>已发布文章会从数据库自动显示在首页和博客页。</p><Link className="arrow-link" href="/">返回首页 →</Link></section></main> }
