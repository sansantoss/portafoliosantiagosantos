'use client';
import { copyText } from './toast';
import { droneCelebrate } from './drone-events';
import { achieve } from './achievements';

export function CopyEmail({ email, copiedLabel }: { email: string; copiedLabel: string }) {
  return (
    <button type="button" className="copy" onClick={() => {
        copyText(email, copiedLabel);
        droneCelebrate();
        achieve('contact');
      }}>
      {email}
    </button>
  );
}
