import React, { useState, useEffect } from 'react';
import DinoImage from './DinoImage';
import { speakKorean, stopSpeaking } from '../utils/tts';

export default function SilhouetteQuiz({ dinos, imageMap }) {
  const [target, setTarget] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const nextQuestion = () => {
    stopSpeaking();
    // 이미지가 로드된 공룡을 우선 출제해 실루엣 품질 보장
    const pool = dinos.filter((d) => imageMap[d.wikiTitle]);
    const source = pool.length >= 8 ? pool : dinos;
    const shuffled = [...source].sort(() => 0.5 - Math.random());
    const answer = shuffled[0];
    const choices = shuffled.slice(0, 4).sort(() => 0.5 - Math.random());

    setTarget(answer);
    setOptions(choices);
    setSelectedId(null);
    setShowHint(false);
  };

  useEffect(() => {
    nextQuestion();
    return () => stopSpeaking();
  }, []);

  if (!target) return null;
  const revealed = selectedId !== null;

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelectedId(opt.id);
    if (opt.id === target.id) {
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
      speakKorean(`정답이에요! ${target.name}! ${target.meaning}이라는 뜻이에요.`);
    } else {
      setStreak(0);
      speakKorean(`아쉬워요! 정답은 ${target.name}였어요.`);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-amber-200 max-w-lg mx-auto text-center">
      <div className="flex justify-between items-center mb-4">
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-extrabold">
          ⭐ 점수: {score}점
        </span>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-extrabold">
          🔥 연속 정답: {streak}회
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-black text-stone-800 mb-2">
        {revealed ? `정답: ${target.name}!` : '이 그림자 공룡은 누구일까요?'}
      </h2>
      <p className="text-xs font-bold text-stone-500 mb-4">
        기본 힌트: {target.period} · {target.domain} · {target.diet}
      </p>

      <div className="bg-stone-100 rounded-3xl h-60 flex items-center justify-center p-5 mb-4 relative">
        <DinoImage
          src={imageMap[target.wikiTitle]}
          dino={target}
          silhouette={!revealed}
          className="h-full w-full"
        />
      </div>

      {!revealed && (
        <div className="mb-4">
          {showHint ? (
            <p className="text-sm font-bold text-indigo-700 bg-indigo-50 py-2 px-3 rounded-xl">
              💡 이름 뜻이 "{target.meaning}"이고 길이는 {target.lengthM}m예요!
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              💡 결정적 힌트 보기
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {options.map((opt) => {
          let btnStyle = 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200';
          if (revealed) {
            if (opt.id === target.id) {
              btnStyle = 'bg-emerald-600 text-white border-emerald-600 scale-102 shadow';
            } else if (opt.id === selectedId) {
              btnStyle = 'bg-rose-500 text-white border-rose-500';
            } else {
              btnStyle = 'bg-stone-100 text-stone-400 border-stone-100';
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className={`py-3.5 px-3 rounded-2xl font-extrabold text-sm sm:text-base transition ${btnStyle}`}
            >
              {opt.name}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button
          onClick={nextQuestion}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow transition"
        >
          다음 공룡 맞히기 ➡️
        </button>
      )}
    </div>
  );
}