import Link from 'next/link';
import { Drone } from '@/components/drone';

export default function NotFound() {
  return (
    <section className="wrap detail notfound">
      <div className="notfound-text">
        <div className="label" style={{ marginBottom: 18 }}>404 — Lost signal</div>
        <h1>Nothing <em className="em">here.</em></h1>
        <p className="lede">The page moved or never existed. My drone looked everywhere. Press ⌘K to search, or head back home.</p>
        <Link href="/" className="btn btn-solid">Back home</Link>
      </div>
      <Drone />
    </section>
  );
}
