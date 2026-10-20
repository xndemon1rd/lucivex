export function HeroSkeleton() {
  return (
    <section className="hero hero--skeleton" aria-busy="true" aria-label="Loading">
      <div className="hero__stage">
        <div className="skeleton hero__poster" />
      </div>
      <div className="hero__copy">
        <div className="skeleton sk-line sk-title" />
        <div className="skeleton sk-line" />
        <div className="skeleton sk-line sk-short" />
      </div>
    </section>
  );
}

export function RailSkeleton({ title = 'Loading' }: { title?: string }) {
  return (
    <section className="rail" aria-busy="true" aria-label={title}>
      <div className="rail__head">
        <div className="skeleton sk-line sk-head" />
      </div>
      <div className="rail__track">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="card" key={i}>
            <span className="card__art skeleton" />
            <span className="skeleton sk-line" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="card" key={i}>
          <span className="card__art skeleton" />
          <span className="skeleton sk-line" />
        </div>
      ))}
    </div>
  );
}
