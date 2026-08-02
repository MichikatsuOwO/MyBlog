type ResumeItem = {
  organization: string
  title: string
  period: string
  location: string
  description: string
}

type Props = {
  title: string
  description: string
  kind: "education" | "work"
  items: ResumeItem[]
  onChange: (items: ResumeItem[]) => void
  save: () => void
  loading: boolean
}

const emptyItem = (): ResumeItem => ({ organization: "", title: "", period: "", location: "", description: "" })

export function ResumeEditor({ title, description, kind, items, onChange, save, loading }: Props) {
  const organizationLabel = kind === "education" ? "学校 / 院校" : "公司 / 组织"
  const titleLabel = kind === "education" ? "学历 / 专业" : "职位 / 角色"
  const update = (index: number, field: keyof ResumeItem, value: string) => onChange(items.map((item, current) => current === index ? { ...item, [field]: value } : item))

  return <section className="post-panel resume-editor">
    <div className="panel-heading">
      <div><h2>{title}</h2><p>{description}</p></div>
      <div className="resume-editor-actions"><button type="button" className="text-button" onClick={() => onChange([...items, emptyItem()])}>+ 添加经历</button><button type="button" disabled={loading} onClick={save}>{loading ? "正在保存…" : "保存履历"}</button></div>
    </div>
    {items.length ? <div className="resume-editor-list">{items.map((item, index) => <article className="resume-editor-row" key={index}>
      <span className="resume-editor-index">{String(index + 1).padStart(2, "0")}</span>
      <div className="resume-editor-fields">
        <label>{organizationLabel}<input value={item.organization} placeholder={kind === "education" ? "例如：中国海洋大学" : "例如：某科技公司"} onChange={(event) => update(index, "organization", event.target.value)} /></label>
        <label>{titleLabel}<input value={item.title} placeholder={kind === "education" ? "例如：计算机科学与技术 · 本科" : "例如：全栈工程师"} onChange={(event) => update(index, "title", event.target.value)} /></label>
        <label>时间<input value={item.period} placeholder="例如：2021.09 — 2025.06" onChange={(event) => update(index, "period", event.target.value)} /></label>
        <label>地点（可选）<input value={item.location} placeholder="例如：青岛 / Remote" onChange={(event) => update(index, "location", event.target.value)} /></label>
        <label className="full">说明（可选）<textarea value={item.description} placeholder="写下方向、职责、成果或这段经历的重点。" onChange={(event) => update(index, "description", event.target.value)} /></label>
      </div>
      <button type="button" className="danger-button resume-remove" onClick={() => onChange(items.filter((_, current) => current !== index))}>删除</button>
    </article>)}</div> : <p className="muted resume-empty">还没有添加经历；前台不会显示空的履历区块。</p>}
  </section>
}
