"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Dumbbell, Plus } from "lucide-react";
import { Drawer } from "./Drawer";
import { formatDisplayDate, todayISO } from "@/lib/date";
import type { AIInsight, ExercisePR } from "@/lib/types";

interface PRTabProps {
  prs: ExercisePR[];
  insights: AIInsight[];
  onSave: (values: Omit<ExercisePR, "id" | "createdAt" | "updatedAt">) => Promise<void>;
}

interface PRFormState {
  exerciseName: string;
  muscleGroup: string;
  weight: string;
  date: string;
  notes: string;
}

const emptyForm = (): PRFormState => ({
  exerciseName: "",
  muscleGroup: "",
  weight: "",
  date: todayISO(),
  notes: "",
});

export function PRTab({ prs, insights, onSave }: PRTabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<PRFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const groups = useMemo(() => {
    const records = new Map<string, ExercisePR[]>();
    prs.forEach((record) => {
      const existing = records.get(record.exerciseName) ?? [];
      existing.push(record);
      records.set(record.exerciseName, existing);
    });
    return [...records.entries()]
      .map(([name, values]) => {
        const chronological = [...values].sort((a, b) => b.date.localeCompare(a.date));
        const best = [...values].sort((a, b) => b.weight - a.weight)[0];
        const previous = chronological[1];
        return {
          name,
          best,
          latest: chronological[0],
          delta: previous ? chronological[0].weight - previous.weight : null,
        };
      })
      .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
  }, [prs]);

  const history = [...prs].sort((a, b) => b.date.localeCompare(a.date));
  const latestInsight = [...insights]
    .filter((insight) => insight.kind === "pr")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        exerciseName: form.exerciseName.trim(),
        muscleGroup: form.muscleGroup.trim() || undefined,
        weight: Number(form.weight),
        date: form.date,
        notes: form.notes.trim() || undefined,
      });
      setDrawerOpen(false);
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-enter subpage">
      <header className="page-heading">
        <div>
          <p className="eyebrow">极限力量</p>
          <h1>每一次突破，都有记录。</h1>
          <p>只保存你亲自确认的真实 PR。</p>
        </div>
        <button className="button primary" type="button" onClick={() => setDrawerOpen(true)}>
          <Plus size={17} /> 记录新 PR
        </button>
      </header>

      {latestInsight ? (
        <section className="inline-insight compact" aria-label="PR 提示">
          <span>FORM NOTE</span>
          <p>{latestInsight.summary}</p>
        </section>
      ) : null}

      {groups.length ? (
        <section className="pr-board" aria-label="动作最佳纪录">
          {groups.map(({ name, best, latest, delta }) => (
            <article className="pr-row" key={name}>
              <span className="pr-mark"><Dumbbell size={18} /></span>
              <div className="pr-name">
                <small>{best.muscleGroup || "自定义动作"}</small>
                <h2>{name}</h2>
              </div>
              <div className="pr-weight">
                <strong>{best.weight}</strong><span>kg</span>
              </div>
              <div className={`pr-delta ${delta && delta > 0 ? "positive" : ""}`}>
                {delta === null ? "首次记录" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
                <small>较上次记录</small>
              </div>
              <time>{formatDisplayDate(latest.date)}</time>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <Dumbbell size={28} />
          <h2>还没有 PR</h2>
          <p>从一个你最重视的动作开始。</p>
          <button className="text-button" type="button" onClick={() => setDrawerOpen(true)}>
            添加第一条记录 <ArrowUpRight size={16} />
          </button>
        </section>
      )}

      {history.length ? (
        <section className="history-section">
          <header>
            <p className="eyebrow">历史记录</p>
            <span>{history.length} 条</span>
          </header>
          <div className="history-list">
            {history.map((record) => (
              <div key={record.id}>
                <time>{formatDisplayDate(record.date)}</time>
                <strong>{record.exerciseName}</strong>
                <span>{record.weight} kg</span>
                <small>{record.notes || record.muscleGroup || "—"}</small>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Drawer open={drawerOpen} title="记录新的真实 PR" eyebrow="极限力量" onClose={() => setDrawerOpen(false)}>
        <form className="form-stack" onSubmit={submit}>
          <label>
            <span>动作名称</span>
            <input
              list="exercise-names"
              value={form.exerciseName}
              onChange={(event) => setForm({ ...form, exerciseName: event.target.value })}
              placeholder="例如：杠铃深蹲"
              required
              autoFocus
            />
            <datalist id="exercise-names">
              {[...new Set(prs.map((record) => record.exerciseName))].map((name) => <option key={name} value={name} />)}
            </datalist>
          </label>
          <label>
            <span>主要肌群（可选）</span>
            <input
              value={form.muscleGroup}
              onChange={(event) => setForm({ ...form, muscleGroup: event.target.value })}
              placeholder="例如：腿部、胸部"
            />
          </label>
          <div className="field-pair">
            <label>
              <span>PR 重量 / kg</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.weight}
                onChange={(event) => setForm({ ...form, weight: event.target.value })}
                required
              />
            </label>
            <label>
              <span>日期</span>
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
            </label>
          </div>
          <label>
            <span>备注（可选）</span>
            <textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <div className="form-actions">
            <button className="button ghost" type="button" onClick={() => setDrawerOpen(false)}>取消</button>
            <button className="button primary" type="submit" disabled={saving}>{saving ? "保存中…" : "保存 PR"}</button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
