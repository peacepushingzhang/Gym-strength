"use client";

import { Activity } from "lucide-react";
import { getBodyMetricHistory } from "@/lib/bodyMetrics";
import { formatDisplayDate } from "@/lib/date";
import type { BodyMetric } from "@/lib/types";

interface BodyMetricHistoryProps {
  metrics: BodyMetric[];
  onAdd: () => void;
}

const formatChange = (value?: number, unit = "") => {
  if (value === undefined) return "首次记录";
  const rounded = Math.abs(value) < 0.05 ? 0 : value;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}${unit}`;
};

export function BodyMetricHistory({ metrics, onAdd }: BodyMetricHistoryProps) {
  const history = getBodyMetricHistory(metrics);

  if (history.length === 0) {
    return (
      <div className="body-history-empty">
        <Activity size={25} />
        <h3>还没有身体记录</h3>
        <p>记录第一次体重和体脂后，这里会按时间展示变化。</p>
        <button className="button primary" type="button" onClick={onAdd}>记录身体数据</button>
      </div>
    );
  }

  return (
    <div className="body-history">
      <header>
        <p>{history.length} 条记录</p>
        <button className="text-button" type="button" onClick={onAdd}>新增记录</button>
      </header>
      <div className="body-history-labels" aria-hidden="true">
        <span>日期</span><span>体重</span><span>体脂</span><span>较上次</span>
      </div>
      <div className="body-history-list">
        {history.map((metric) => (
          <article key={metric.id}>
            <time dateTime={metric.date}>{formatDisplayDate(metric.date)}</time>
            <strong>{metric.weight.toFixed(1)} <small>kg</small></strong>
            <strong>{metric.bodyFat.toFixed(1)} <small>%</small></strong>
            <div>
              <span className={metric.weightChange !== undefined && metric.weightChange <= 0 ? "favorable" : ""}>
                {formatChange(metric.weightChange, " kg")}
              </span>
              <small>{formatChange(metric.bodyFatChange, "%")}</small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
