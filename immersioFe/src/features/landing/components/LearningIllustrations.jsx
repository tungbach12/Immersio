import * as React from 'react';

const teal = '#176557', ink = '#173F37', cream = '#FBF6E9', gold = '#E5B85C', coral = '#D98E72';

export function PaperPlane({ className = '' }) {
  return <svg className={`tpp-svg ${className}`} width="280" height="210" viewBox="0 0 280 210" aria-hidden="true">
    <path d="M14 196 Q68 138 101 173 T170 150" fill="none" stroke="#DBE9CE" strokeWidth="2" strokeDasharray="5 8" opacity=".65" />
    <g className="learn-plane-body">
      <path d="M28 79 L254 20 L171 174 L139 113 Z" fill={cream} stroke="#D2DCCA" strokeWidth="1.5" />
      <path d="M28 79 L139 113 L254 20 L102 97 Z" fill="#E5EDDA" />
      <path d="M139 113 L136 153 L171 174" fill="#B4CEB9" />
      <path d="M139 113 L254 20 L156 132 L171 174" fill="#F9EDD1" />
      <path d="M139 113 L254 20" stroke="#8DAD97" strokeWidth="1.3" />
      <path d="M92 67 L139 54" stroke={gold} strokeWidth="7" strokeLinecap="round" />
    </g>
  </svg>;
}

export function BookStack() {
  return <svg className="tpp-svg" viewBox="0 0 330 240" aria-hidden="true">
    <ellipse cx="170" cy="213" rx="146" ry="14" fill="#082E28" opacity=".15" />
    <g transform="rotate(-5 160 183)"><path d="M34 160 Q24 160 24 183 T34 206 H294 V160 Z" fill={coral} /><path d="M42 167 H285 V198 H42 Q33 182 42 167" fill={cream} /><path d="M52 176 H274 M51 184 H276 M52 192 H272" stroke="#DED8C9" /><path d="M240 162 V207 L254 197 L268 207 V162" fill={gold} /></g>
    <g transform="rotate(4 162 140)"><rect x="45" y="109" width="259" height="44" rx="8" fill={teal} /><path d="M63 116 H296 V146 H63 Q54 131 63 116" fill="#F8F1DE" /><path d="M70 124 H285 M70 132 H288 M70 140 H283" stroke="#D2D9C2" /></g>
    <path d="M46 104 Q100 53 171 84 Q232 57 289 101 L282 132 Q225 91 170 114 Q105 81 48 125 Z" fill="#F7F0DC" stroke="#C6CEB5" strokeWidth="2" />
    <path d="M171 84 L170 114 M62 101 Q107 72 152 89 M65 111 Q108 84 150 101 M190 90 Q234 74 271 99 M190 103 Q232 90 268 111" fill="none" stroke="#9CB5A0" strokeWidth="2" />
    <path d="M170 114 L175 155 L186 147 L195 152 L190 107" fill={gold} /><path d="M87 33 l5 -12 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 Z" fill={gold} />
  </svg>;
}

export function WordCards({ className = '' }) {
  return <svg className={`tpp-svg ${className}`} width="280" height="210" viewBox="0 0 280 210" aria-hidden="true">
    <g transform="rotate(-13 105 100)"><rect x="32" y="21" width="149" height="167" rx="7" fill={gold} /><rect x="40" y="29" width="133" height="151" rx="4" fill="#F6E4B7" /><text x="60" y="65" fontFamily="Georgia,serif" fontSize="28" fill={ink}>Aa</text><path d="M59 84 H144 M59 98 H132 M59 151 H144" stroke="#BDAC79" /></g>
    <g transform="rotate(9 188 115)"><rect x="107" y="45" width="144" height="154" rx="7" fill={cream} stroke="#BDCDB5" strokeWidth="2" /><text x="179" y="100" textAnchor="middle" fontFamily="Georgia,serif" fontSize="26" fill={teal}>curious</text><text x="179" y="123" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" letterSpacing="2" fill={ink}>/ˈkjʊəriəs/</text><path d="M133 142 H225 M133 155 H213" stroke="#B7C5AB" /><path d="M221 63 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" fill={coral} /></g>
  </svg>;
}

export function Headphones() {
  return <svg className="tpp-svg" viewBox="0 0 200 190" aria-hidden="true">
    <path d="M44 105 V82 A56 56 0 0 1 156 82 V108" fill="none" stroke={gold} strokeWidth="18" /><path d="M44 105 V82 A56 56 0 0 1 156 82 V108" fill="none" stroke="#F5D186" strokeWidth="7" />
    <g className="learn-headphone-cups"><rect x="30" y="93" width="37" height="64" rx="15" fill={cream} /><rect x="133" y="93" width="37" height="64" rx="15" fill={cream} /><rect x="52" y="98" width="17" height="54" rx="8" fill={coral} /><rect x="131" y="98" width="17" height="54" rx="8" fill={coral} /></g>
    <path d="M151 157 Q143 184 112 179" fill="none" stroke={gold} strokeWidth="4" strokeLinecap="round" /><circle cx="108" cy="179" r="5" fill={cream} />
  </svg>;
}

function Learner({ x = 0, y = 0, shirt = teal, flip = false }) {
  return <g transform={`translate(${x} ${y}) ${flip ? 'translate(130 0) scale(-1 1)' : ''}`}>
    <path d="M16 168 Q21 103 66 103 Q108 103 122 168 Z" fill={shirt} /><path d="M57 100 V117 Q67 127 78 117 V98" fill="#C67F58" /><ellipse cx="68" cy="74" rx="29" ry="36" fill="#E0AA79" />
    <path d="M38 75 Q27 34 65 27 Q102 24 104 62 L93 87 L90 59 Q66 66 51 48 L46 82 Z" fill={ink} /><circle cx="59" cy="75" r="2" fill={ink} /><circle cx="78" cy="75" r="2" fill={ink} /><path d="M62 88 Q69 94 76 87" fill="none" stroke="#8C513C" strokeWidth="2" strokeLinecap="round" /><path d="M28 143 L76 166 L105 144" fill="none" stroke="#E0AA79" strokeWidth="13" strokeLinecap="round" />
  </g>;
}

function Dialogue() {
  return <>
    <Learner x={12} y={97} /><Learner x={250} y={97} shirt={coral} flip /><path d="M30 201 Q170 188 373 208 L384 278 H15 Z" fill="#C3D6B5" />
    <g className="learn-bubble"><path d="M31 28 H208 Q222 28 222 42 V93 Q222 107 208 107 H103 L82 128 L82 107 H31 Q17 107 17 93 V42 Q17 28 31 28 Z" fill={cream} stroke="#B9CFB4" strokeWidth="1.5" /><text x="120" y="61" textAnchor="middle" fill={ink} fontFamily="Georgia,serif" fontSize="23">How’s your day?</text><text x="120" y="86" textAnchor="middle" fill={teal} fontFamily="system-ui,sans-serif" fontSize="12">A GOOD PLACE TO START</text></g>
    <g className="learn-bubble-reply"><path d="M261 85 H372 Q386 85 386 99 V143 Q386 157 372 157 H332 V172 L316 157 H261 Q247 157 247 143 V99 Q247 85 261 85 Z" fill={gold} /><text x="316" y="129" textAnchor="middle" fill={ink} fontFamily="Georgia,serif" fontSize="25">Pretty good!</text></g>
    <rect x="167" y="188" width="38" height="34" rx="4" fill={cream} /><path d="M205 194 Q227 195 216 214 H205" fill="none" stroke={cream} strokeWidth="6" /><path d="M185 180 Q180 168 187 157" fill="none" stroke="#8FAA91" strokeWidth="2" />
  </>;
}

export function LearningIllustration({ kind = 'conversation' }) {
  return <svg className="tpp-svg tpp-fill" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <rect width="400" height="300" fill={kind === 'listening' ? '#D6E2CA' : kind === 'travel' ? '#ECD9BC' : '#DFE9D4'} /><circle cx="343" cy="27" r="113" fill={cream} opacity=".5" /><circle cx="25" cy="286" r="88" fill="#B4CDB2" opacity=".45" />
    {kind === 'conversation' && <Dialogue />}
    {kind === 'words' && <g transform="translate(24 6) scale(1.28)"><WordCards /></g>}
    {kind === 'listening' && <><g transform="translate(104 7)"><Learner /></g><path d="M144 89 V77 a30 30 0 0 1 60 0 V89" fill="none" stroke={gold} strokeWidth="11" /><rect x="133" y="79" width="20" height="39" rx="9" fill={gold} /><rect x="194" y="79" width="20" height="39" rx="9" fill={gold} /><rect x="37" y="207" width="326" height="60" rx="12" fill={cream} />{[20,35,15,28,40,24,12,36,22,34,16,28,40,18,27].map((height, index) => <rect key={index} className="learn-wave" x={58 + index * 20} y={237 - height / 2} width="5" height={height} rx="2.5" fill={teal} style={{ animationDelay: `${index * -.12}s` }} />)}<text x="274" y="139" fill={teal} fontFamily="Georgia,serif" fontSize="36">“hello”</text></>}
    {kind === 'travel' && <><g transform="translate(20 82) rotate(-8 90 100)"><rect width="129" height="171" rx="7" fill={teal} /><rect x="7" y="7" width="115" height="157" rx="4" fill="none" stroke="#A5BE96" /><circle cx="65" cy="73" r="29" fill="none" stroke={gold} strokeWidth="2" /><path d="M36 73 H94 M65 44 Q35 73 65 102 Q94 73 65 44 M65 44 V102" fill="none" stroke={gold} strokeWidth="1.5" /><text x="65" y="127" textAnchor="middle" fill={cream} fontSize="14" fontFamily="Georgia,serif" letterSpacing="2">LET’S GO</text></g><g transform="translate(167 5) scale(.7)"><PaperPlane /></g><g transform="rotate(7 279 189)"><rect x="184" y="134" width="176" height="98" rx="5" fill={cream} /><path d="M197 160 H345 M197 210 H345 M297 142 V224" stroke="#CCD4BD" strokeDasharray="3 3" /><text x="209" y="189" fill={teal} fontFamily="Georgia,serif" fontSize="22">Where next?</text></g></>}
    {kind === 'journal' && <><g transform="rotate(-6 179 155)"><rect x="62" y="26" width="236" height="253" rx="10" fill={teal} /><rect x="76" y="26" width="215" height="253" rx="7" fill={cream} /><path d="M101 27 V277" stroke={coral} strokeOpacity=".5" />{[77,111,145,179,213,247].map(y => <path key={y} d={`M78 ${y} H289`} stroke="#BDD0B8" />)}<text x="120" y="69" fontSize="22" fill={teal} fontFamily="Georgia,serif">A little, every day.</text>{['A word I learned', 'A phrase I tried', 'A moment to remember'].map((text, i) => <g key={text}><rect x="118" y={97 + i * 34} width="13" height="13" rx="2" fill="none" stroke={teal} /><path d={`M120 ${104 + i * 34} l3 3 l7 -8`} fill="none" stroke={teal} strokeWidth="2" /><text x="141" y={108 + i * 34} fontSize="12" fill={ink} fontFamily="system-ui,sans-serif">{text}</text></g>)}</g><g transform="rotate(20 318 170)"><rect x="309" y="72" width="17" height="169" rx="3" fill={gold} /><path d="M309 241 L318 262 L326 241" fill="#D0AD78" /><path d="M315 255 L318 262 L321 255" fill={ink} /><rect x="309" y="68" width="17" height="19" rx="3" fill={coral} /></g></>}
  </svg>;
}

export function LearningImage({ src, kind, alt = '' }) {
  return <div className="tpp-fill overflow-clip" style={{ background: kind === 'travel' ? '#ECD9BC' : kind === 'listening' ? '#D6E2CA' : '#DFE9D4' }}>{src ? <img src={src} alt={alt} className="tpp-fill" style={{ objectFit: 'cover' }} draggable={false} /> : <LearningIllustration kind={kind} />}</div>;
}

export function StudyBackdrop({ tone = 'dark', hero = false }) {
  const light = tone === 'light';
  return <div className={`tpp-fill learn-backdrop ${light ? 'learn-backdrop-light' : ''}`} aria-hidden="true">
    <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <circle cx="850" cy="460" r="550" fill={light ? '#E4E9D5' : '#4B8870'} opacity={light ? '.4' : '.14'} /><path d="M-30 900 Q240 800 420 864 T860 883 T1660 820 V1100 H-30 Z" fill={light ? '#D4DEC6' : '#062F28'} opacity=".5" />
      <path d="M-10 329 Q253 190 370 354 M1200 215 Q1470 305 1520 124" fill="none" stroke={light ? '#8FAC95' : '#A6C7A8'} strokeWidth="1.5" strokeDasharray="4 10" opacity=".35" />
      {[[80,130], [1450,540], [540,145], [1080,750]].map(([x,y]) => <path key={x} d={`M${x} ${y - 10} l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z`} fill={gold} opacity=".5" />)}
      {hero && <><text x="120" y="492" fill="#B5C6A3" opacity=".065" fontFamily="Georgia,serif" fontSize="320">Aa</text><path d="M85 574 Q167 539 248 579 V728 Q165 690 85 723 Z M248 579 Q326 539 410 571 V720 Q328 690 248 728 Z" fill="none" stroke="#B5C6A3" strokeWidth="2" opacity=".12" /></>}
    </svg>
    {hero && <><div className="learn-hero-books tpp-par" data-dp="8"><BookStack /></div><div className="learn-hero-words tpp-par" data-dp="-6"><WordCards /></div></>}
  </div>;
}

export function JournalLines() {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  return <svg className="tpp-svg tpp-fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id={`ruled-${id}`} width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 39.5 H80" stroke="#84A38B" strokeOpacity=".14" /><path d="M79.5 0 V40" stroke="#84A38B" strokeOpacity=".06" /></pattern></defs><rect width="1600" height="1000" fill={`url(#ruled-${id})`} /><path d="M107 0 V1000" stroke={coral} strokeOpacity=".18" strokeWidth="2" /><text x="1185" y="245" fontFamily="Georgia,serif" fontSize="118" fill={teal} opacity=".045">keep going.</text></svg>;
}

export function LearningBadge() {
  return <svg className="tpp-svg" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1" /><circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 3" /><path d="M17 35 l10 10 l21 -26" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function BrandStamp() {
  return <svg className="tpp-svg" width="46" height="54" viewBox="0 0 46 54" aria-hidden="true"><rect x="1" y="1" width="44" height="52" fill="none" stroke="currentColor" strokeWidth="1.2" /><rect x="4" y="4" width="38" height="31" fill="none" stroke="currentColor" strokeWidth=".7" /><path d="M10 15 Q17 12 23 16 Q30 12 36 15 V28 Q29 25 23 29 Q16 25 10 28 Z M23 16 V29" fill="none" stroke="currentColor" strokeWidth="1.4" /><text x="23" y="45" textAnchor="middle" fontSize="6.5" letterSpacing="1.3" fill="currentColor" fontFamily="Georgia,serif">HELLO</text></svg>;
}
