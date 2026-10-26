type P = { size?: number };
const base = (size = 18) => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true,
});
export const Search = ({ size }: P) => (<svg {...base(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const Chat = ({ size }: P) => (<svg {...base(size)}><path d="M4 5h16v11H9l-5 4z" /></svg>);
export const Folder = ({ size }: P) => (<svg {...base(size)}><rect x="4" y="4" width="16" height="16" /><path d="M4 10h16" /></svg>);
export const Doc = ({ size }: P) => (<svg {...base(size)}><path d="M6 3h9l3 3v15H6z" /><path d="M9 10h6M9 14h6" /></svg>);
export const Copy = ({ size }: P) => (<svg {...base(size)}><rect x="8" y="8" width="12" height="12" /><path d="M4 16V4h12" /></svg>);
export const Download = ({ size }: P) => (<svg {...base(size)}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>);
export const External = ({ size }: P) => (<svg {...base(size)}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>);
export const Sun = ({ size }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const Arrow = ({ size }: P) => (<svg {...base(size)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
