export type Post = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  body: string;
};

export type Project = {
  title: string;
  description: string;
  stack: string[];
  href?: string;
};

// 内容由生产数据库维护；这里仅保留共享类型，避免再次打包演示数据。
export const posts: Post[] = [];
export const projects: Project[] = [];
