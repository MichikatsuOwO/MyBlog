import type { Metadata } from "next"
import "./globals.css"
import "./functional.css"
import "./categories.css"
import "./sidebar-compact.css"
import "./sidebar-clean.css"
import "./markdown.css"
import "./about.css"
import "./about-resume.css"
import "./(admin)/admin/admin.css"
import "./(admin)/admin/preview.css"
export const metadata: Metadata = { title: "Paperlane — 个人网站", description: "设计、代码与正在发生的事情。" }
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body>{children}</body></html> }
