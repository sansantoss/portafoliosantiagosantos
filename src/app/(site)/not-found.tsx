import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap detail">
      <div className="label" style={{ marginBottom: 18 }}>404</div>
      <h1>Nothing here.</h1>
      <p className="lede">The page moved or never existed. Press ⌘K to search.</p>
      <Link href="/" className="btn btn-solid">Back home</Link>
    </section>
  );
}
