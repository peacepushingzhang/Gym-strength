"use client";

import { useState } from "react";
import { todayISO } from "@/lib/date";

interface BodyMetricFormProps {
  onSubmit: (values: { date: string; weight: number; bodyFat: number }) => Promise<void>;
  onCancel: () => void;
}

export function BodyMetricForm({ onSubmit, onCancel }: BodyMetricFormProps) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ date, weight: Number(weight), bodyFat: Number(bodyFat) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        <span>日期</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
      </label>
      <div className="field-pair">
        <label>
          <span>体重 / kg</span>
          <input
            type="number"
            min="20"
            max="400"
            step="0.1"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            placeholder="72.5"
            required
            autoFocus
          />
        </label>
        <label>
          <span>体脂 / %</span>
          <input
            type="number"
            min="1"
            max="70"
            step="0.1"
            value={bodyFat}
            onChange={(event) => setBodyFat(event.target.value)}
            placeholder="16.8"
            required
          />
        </label>
      </div>
      <div className="form-actions">
        <button className="button ghost" type="button" onClick={onCancel}>
          取消
        </button>
        <button className="button primary" type="submit" disabled={saving}>
          {saving ? "保存中…" : "保存记录"}
        </button>
      </div>
    </form>
  );
}
