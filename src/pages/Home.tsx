import { apiGet } from '../lib/api';
import { homeSections, unwrap } from '../lib/normalize';
import { useAsync } from '../lib/useAsync';
import Hero from '../components/Hero';
import Carousel from '../components/Carousel';
import { HeroSkeleton, RailSkeleton } from '../components/Skeletons';
import { EmptyState, ErrorState } from '../components/States';
import { Link } from '../lib/router';

export default function Home() {
  const home = useAsync('home', (signal, fresh) =>
    apiGet('/api/home', { signal, fresh }).then((j) => homeSections(unwrap(j))),
  );

  if (home.status === 'loading' || home.status === 'idle') {
    return (
      <>
        <HeroSkeleton />
        <RailSkeleton />
        <RailSkeleton />
      </>
    );
  }
  if (home.status === 'error' && home.error) {
    return (
      <div className="page">
        <ErrorState error={home.error} onRetry={home.retry} />
      </div>
    );
  }

  const sections = home.data ?? [];
  if (sections.length === 0) {
    return (
      <div className="page">
        <EmptyState title="Nothing to show yet">
          The API answered, but no anime lists were recognised in the response. Open{' '}
          <Link to="/status">Status</Link> to inspect what it returned.
        </EmptyState>
      </div>
    );
  }

  const first = sections[0];
  return (
    <>
      <Hero items={first.items.slice(0, 6)} label={first.title} />
      {sections.map((s) => (
        <Carousel key={s.key} title={s.title} items={s.items} />
      ))}
      <p className="footnote">
        Lucivex does not host video. Titles, artwork and playback sources come from the connected API.
      </p>
    </>
  );
}
