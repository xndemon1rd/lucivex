import { Link, useRoute } from '../lib/router';
import { Wordmark } from './Logo';
import { CompassIcon, HomeIcon, PulseIcon, SearchIcon } from './Icons';

const LINKS = [
  { to: '/', label: 'Home', icon: HomeIcon, match: (p: string) => p === '/' },
  { to: '/search', label: 'Search', icon: SearchIcon, match: (p: string) => p.startsWith('/search') },
  { to: '/browse', label: 'Browse', icon: CompassIcon, match: (p: string) => p.startsWith('/browse') },
  { to: '/status', label: 'Status', icon: PulseIcon, match: (p: string) => p.startsWith('/status') },
];

export function Header() {
  const { path } = useRoute();
  return (
    <header className="top">
      <Link to="/" className="top__brand" aria-label="Lucivex home">
        <Wordmark />
      </Link>
      <nav className="top__links" aria-label="Main">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} className="navlink" aria-current={l.match(path) ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <Link to="/search" className="top__search" aria-label="Search">
        <SearchIcon size={20} />
      </Link>
    </header>
  );
}

export function Tabs() {
  const { path } = useRoute();
  return (
    <nav className="tabs" aria-label="Main">
      {LINKS.map((l) => {
        const Icon = l.icon;
        return (
          <Link key={l.to} to={l.to} aria-current={l.match(path) ? 'page' : undefined}>
            <Icon size={22} />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
