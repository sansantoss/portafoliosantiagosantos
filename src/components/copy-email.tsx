'use client';
import { copyText } from './toast';

export function CopyEmail({ email }: { email: string }) {
  return (
    <button type="button" className="copy" onClick={() => copyText(email, 'Email copied')}>
      {email}
    </button>
  );
}
