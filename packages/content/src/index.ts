export type Post = { slug: string; title: string; excerpt: string; date: string; tags: string[]; minutes: number; body: string }
export type Project = { slug: string; title: string; year: string; kind: string; description: string; accent: string }

export const posts: Post[] = [
  { slug: "designing-for-calm", title: "为安静而设计", excerpt: "关于节奏、留白，以及如何让内容自己说话。", date: "2026-07-18", tags: ["设计", "随笔"], minutes: 4, body: "好的个人网站不是信息的仓库。它应该像一本摊开的笔记：让访客先感受你的判断，再决定要不要继续读下去。\n\n我喜欢把每个页面都留出一点呼吸。没有必要的装饰会很快过时，清楚的内容不会。" },
  { slug: "shipping-small-tools", title: "把小工具做成完整作品", excerpt: "从想法到发布：一个周末项目的边界与取舍。", date: "2026-07-05", tags: ["开发", "产品"], minutes: 6, body: "小项目最难的不是开始，而是知道什么时候已经足够。先找到一个明确的人和一个明确的问题，再为它做一个可靠、克制的解决方案。" },
  { slug: "notes-on-web", title: "我仍然相信 Web", excerpt: "开放的链接、可访问的内容，和属于自己的角落。", date: "2026-06-21", tags: ["Web", "观点"], minutes: 3, body: "网页仍然是最轻盈的表达媒介。它不需要算法许可，也不该被平台格式化。拥有自己的域名，就是在喧闹互联网里保留一个可长期访问的地址。" }
]

export const projects: Project[] = [
  { slug: "north-star", title: "North Star", year: "2026", kind: "品牌网站", description: "为独立创作者设计的、带有编辑感的发布空间。", accent: "#d7e7df" },
  { slug: "field-notes", title: "Field Notes", year: "2025", kind: "移动产品", description: "把零散观察收进一条轻巧的日常记录流。", accent: "#f3dfc7" },
  { slug: "common-room", title: "Common Room", year: "2025", kind: "社区工具", description: "让小团队更自然地分享进展与想法。", accent: "#dcd8f0" }
]
