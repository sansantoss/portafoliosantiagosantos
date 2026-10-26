'use client';
import { copyText } from './toast';
import { droneCelebrate } from './drone-events';

export function CopyEmail({ email }: { email: string }) {
  return (
    <button type="button" className="copy" onClick={() => {
        copyText(email, 'Email copied');
        droneCelebrate();
      }}>
      {email}
    </button>
  );
}
