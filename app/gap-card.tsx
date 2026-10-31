export type Gap = {
  id: number; title: string; gap_type: string; market: string; summary: string; score: number;
  market_size: number; growth: number; competition: number; fit: number; profit: number;
  published_at: string | null; gap_sources?: { url: string; source_name: string }[];
};

export function GapCard({ g }: { g: Gap }) {
  return (
    <article className="card">
      <h3>{g.title} <span className="muted">· {Number(g.score).toFixed(1)}/10</span></h3>
      <p className="muted">{g.gap_type} gap · {g.market}</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{g.summary}</p>
      <p className="muted">
        Market {g.market_size} · Growth {g.growth} · Competition {g.competition} · Fit {g.fit} · Profit {g.profit}
      </p>
      {g.gap_sources?.length ? (
        <p>Sources: {g.gap_sources.map((s, i) => (
          <span key={i}>{i > 0 && ' · '}<a href={s.url} rel="nofollow noopener" target="_blank">{s.source_name}</a></span>
        ))}</p>
      ) : null}
    </article>
  );
}
