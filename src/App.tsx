import { useEffect, useState } from 'react';
import { matchPath, useRoute } from './lib/router';
import { markIntroSeen, shouldPlayIntro } from './lib/motion';
import Embers from './components/Embers';
import Intro from './components/Intro';
import { Header, Tabs } from './components/Nav';
import { EmptyState } from './components/States';
import Home from './pages/Home';
import Search from './pages/Search';
import Browse from './pages/Browse';
import Detail from './pages/Detail';
import Watch from './pages/Watch';
import Status from './pages/Status';
import { Link } from './lib/router';

function Routes() {
  const { path } = useRoute();
  if (path === '/') return <Home />;
  if (path === '/search') return <Search />;
  if (path === '/browse') return <Browse />;
  if (path === '/status') return <Status />;
  const anime = matchPath('/anime/:id', path);
  if (anime) return <Detail key={anime.id} id={anime.id} />;
  const watch = matchPath('/watch/:id', path);
  if (watch) return <Watch key={watch.id} id={watch.id} />;
  return (
    <div className="page">
      <EmptyState title="Lost in the dark">
        That page does not exist. <Link to="/">Return home</Link>.
      </EmptyState>
    </div>
  );
}

export default function App() {
  const [intro, setIntro] = useState(shouldPlayIntro);
  const { path } = useRoute();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  return (
    <div className="app">
      <Embers className="atmos" count={window.innerWidth < 640 ? 18 : 36} intensity={0.55} paused={intro} />
      <Header />
      <main>
        <Routes />
      </main>
      <Tabs />
      {intro && (
        <Intro
          onDone={() => {
            markIntroSeen();
            setIntro(false);
          }}
        />
      )}
    </div>
  );
}
