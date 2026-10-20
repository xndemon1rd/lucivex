import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Embers from './Embers';

const WORD = 'LUCIVEX'.split('');
const DURATION = 4800;

export default function Intro({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    window.setTimeout(onDone, 650);
  };

  useEffect(() => {
    const t = window.setTimeout(finish, DURATION);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`intro${leaving ? ' is-leaving' : ''}`}
      role="dialog"
      aria-label="Lucivex intro"
      onClick={finish}
    >
      <Embers className="intro__embers" count={window.innerWidth < 640 ? 40 : 80} />
      <div className="intro__eclipse" aria-hidden="true">
        <span className="intro__corona" />
        <span className="intro__ring" />
        <span className="intro__disc" />
      </div>
      <h1 className="intro__word" aria-label="Lucivex">
        {WORD.map((c, i) => (
          <span key={i} aria-hidden="true" style={{ '--i': i } as CSSProperties}>
            {c}
          </span>
        ))}
      </h1>
      <p className="intro__tag">Anime after dark.</p>
      <button
        type="button"
        className="intro__skip"
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
      >
        Skip intro
      </button>
    </div>
  );
}
