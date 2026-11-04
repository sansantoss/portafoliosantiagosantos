import { notFound } from 'next/navigation';

// Any unknown URL renders the site's own 404 (with header, footer and the drone).
export default function Missing() {
  notFound();
}
