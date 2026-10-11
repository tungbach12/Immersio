import * as React from 'react';

const lessons = {
  everyday: {
    label: 'Everyday life', scene: 'At your favourite café', speaker: 'The barista asks',
    prompt: 'What can I get you today?',
    question: 'You’d like a coffee. Which reply fits?',
    answers: ['Could I have a latte, please?', 'I went there yesterday.', 'It’s on the second floor.'],
    correct: 0,
    note: '“Could I have…” is a friendly way to ask for something. Add “please” and you’re ready to order.',
    takeaway: 'Could I have a latte, please?',
  },
  travel: {
    label: 'On your travels', scene: 'Finding your way', speaker: 'You ask a passer-by',
    prompt: 'Excuse me, where’s the station?',
    question: 'Which answer gives you directions?',
    answers: ['I’d like a window seat.', 'Go straight and turn left.', 'It was delicious, thanks.'],
    correct: 1,
    note: '“Go straight” and “turn left” help you follow directions. A small question can open up a whole new city.',
    takeaway: 'Excuse me, where’s the station?',
  },
  work: {
    label: 'At work', scene: 'Meet someone new', speaker: 'Your new colleague says',
    prompt: 'Hi, I’m Sam. Nice to meet you!',
    question: 'How would you introduce yourself?',
    answers: ['The train leaves at nine.', 'I’ll have tea, please.', 'Nice to meet you too. I’m Alex.'],
    correct: 2,
    note: '“Nice to meet you too” warmly returns the greeting. Then share your name to keep the conversation going.',
    takeaway: 'Nice to meet you too. I’m Alex.',
  },
};

export function LessonPreview({ goal, onGoalChange }) {
  const [answer, setAnswer] = React.useState(null);
  const [audioMessage, setAudioMessage] = React.useState('');
  const [speaking, setSpeaking] = React.useState(false);
  const playbackId = React.useRef(0);
  const lesson = lessons[goal] || lessons.everyday;
  const correct = answer === lesson.correct;
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  React.useEffect(() => {
    setAnswer(null);
    setAudioMessage('');
    setSpeaking(false);
    return () => {
      playbackId.current += 1;
      if (supported) window.speechSynthesis.cancel();
    };
  }, [goal, supported]);

  function playPhrase() {
    if (!supported) return;
    const currentPlayback = ++playbackId.current;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lesson.takeaway);
    utterance.lang = 'en-GB';
    utterance.rate = .85;
    const voice = window.speechSynthesis.getVoices().find(voice => voice.lang === 'en-GB')
      || window.speechSynthesis.getVoices().find(voice => voice.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { if (playbackId.current === currentPlayback) { setSpeaking(true); setAudioMessage('Listen, then try saying it aloud.'); } };
    utterance.onend = () => { if (playbackId.current === currentPlayback) { setSpeaking(false); setAudioMessage('Your turn. Say the phrase aloud.'); } };
    utterance.onerror = () => { if (playbackId.current === currentPlayback) { setSpeaking(false); setAudioMessage('Audio isn’t available right now. Try reading the phrase aloud.'); } };
    window.speechSynthesis.speak(utterance);
  }

  return <div className="learn-demo tpp-paper">
    <div className="learn-demo-top">
      <span className="tpp-label">A little practice, right here</span>
      <span className="learn-lesson-count">01 / 01</span>
    </div>
    <div className="learn-goals" role="group" aria-label="Choose a practice situation">
      {Object.entries(lessons).map(([key, item]) => <button type="button" key={key} aria-pressed={key === goal} onClick={() => onGoalChange(key)}>{item.label}</button>)}
    </div>
    <div className="learn-demo-grid">
      <div className="learn-dialogue-card">
        <p className="tpp-label">{lesson.scene}</p>
        <div className="learn-speech">
          <span>{lesson.speaker}</span>
          <p>“{lesson.prompt}”</p>
        </div>
        <p className="learn-question">{lesson.question}</p>
        <span className="learn-hand-note">One reply. A new beginning.</span>
      </div>
      <div className="learn-answer-panel">
        <div className="learn-answers" role="group" aria-label="Choose your reply">
          {lesson.answers.map((text, index) => <button type="button" key={text} aria-pressed={answer === index} data-state={answer === index ? correct ? 'correct' : 'retry' : undefined} onClick={() => { setAnswer(index); setAudioMessage(''); }}>
            <span className="learn-answer-letter">{String.fromCharCode(65 + index)}</span><span>{text}</span><span aria-hidden="true">{answer === index ? correct ? '✓' : '↻' : '↗'}</span>
          </button>)}
        </div>
        <div className="learn-feedback" aria-live="polite" aria-atomic="true">
          {answer === null ? <p>Choose a reply. There’s room to try again.</p> : correct ? <><strong>You’ve got it. Keep talking!</strong><p>{lesson.note}</p></> : <><strong>A good try. Have another go.</strong><p>Think about {goal === 'everyday' ? 'asking for your coffee' : goal === 'travel' ? 'the way to the station' : 'saying hello and sharing your name'}.</p></>}
        </div>
        <div className="learn-demo-actions">
          <button type="button" className="learn-audio" onClick={playPhrase} disabled={!supported} aria-label="Listen to the useful phrase"><span aria-hidden="true">♫</span> {speaking ? 'Play again' : 'Hear the phrase'}</button>
          <button type="button" className="learn-reset" onClick={() => { playbackId.current += 1; setAnswer(null); setAudioMessage(''); if (supported) window.speechSynthesis.cancel(); setSpeaking(false); }}>Try again ↻</button>
        </div>
        <p className="learn-audio-status" aria-live="polite">{supported ? audioMessage : 'Try reading the useful phrase aloud: ' + lesson.takeaway}</p>
      </div>
    </div>
    <div className="learn-demo-bottom"><span>Little moments. Real words. Your own pace.</span><span aria-hidden="true">✦</span></div>
  </div>;
}
