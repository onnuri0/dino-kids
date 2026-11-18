import React, { useState, useEffect, useCallback } from 'react';
import DinoImage from './DinoImage';
import { speakKorean, stopSpeaking } from '../utils/tts';

const FOODS = [
  { id: '육식', emoji: '🍖', label: '싱싱한 고기', sub: '육식 공룡 밥', style: 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900' },
  { id: '초식', emoji: '🌿', label: '푸릇한 나뭇잎', sub: '초식 공룡 밥', style: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900' },
  { id: '잡식', emoji: '🥚', label: '골고루 바구니', sub: '잡식 공룡 밥', style: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900' },
];

function playFeedSound(isYummy) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isYummy) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // 오디오 컨텍스트 제한 시 무시
  }
}

export default function DinoFeedGame({ dinos, imageMap, onOpenDetail }) {
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState('hungry');
  const [flyingEmoji, setFlyingEmoji] = useState(null);
  const [fedCount, setFedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const nextDino = useCallback(() => {
    stopSpeaking();
    const pool = dinos.filter((d) => imageMap[d.wikiTitle]);
    const source = pool.length > 0 ? pool : dinos;
    const randomDino = source[Math.floor(Math.random() * source.length)];

    setTarget(randomDino);
    setStatus('hungry');
    setFlyingEmoji(null);
    setShowHint(false);
  }, [dinos, imageMap]);

  useEffect(() => {
    nextDino();
    return () => stopSpeaking();
  }, [nextDino]);

  if (!target) return null;

  const getToothClue = (dino) => {
    if (dino.diet === '육식') return '날카로운 이빨이나 발톱으로 사냥을 좋아해요!';
    if (dino.diet === '초식') return '높은 나무의 잎이나 부드러운 풀을 좋아해요!';
    return '식물과 열매, 작은 곤충까지 가리지 않고 다 잘 먹어요!';
  };

  const handleFeed = (food) => {
    if (status === 'happy') return;

    setFlyingEmoji(food.emoji);

    if (food.id === target.diet) {
      setStatus('happy');
      setFedCount((c) => c + 1);
      setStreak((s) => s + 1);
      playFeedSound(true);
      speakKorean('냠냠 맛있어요! ' + target.name + '는 ' + target.diet + ' 공룡이에요! 고마워요!');
    } else {
      setStatus('nope');
      setStreak(0);
      playFeedSound(false);
      speakKorean('으음, 이건 내 밥이 아니에요! 다른 먹이를 골라볼까요?');
      setTimeout(() => {
        setStatus((prev) => (prev === 'nope' ? 'hungry' : prev));
        setFlyingEmoji(null);
      }, 900);
    }
  };

  const bubbleClass =
    status === 'happy'
      ? 'mb-4 py-3 px-4 rounded-2xl border-2 font-extrabold text-sm sm:text-base transition-all bg-emerald-50 border-emerald-200 text-emerald-800'
      : status === 'nope'
      ? 'mb-4 py-3 px-4 rounded-2xl border-2 font-extrabold text-sm sm:text-base transition-all bg-rose-50 border-rose-200 text-rose-700'
      : 'mb-4 py-3 px-4 rounded-2xl border-2 font-extrabold text-sm sm:text-base transition-all bg-amber-50 border-amber-200 text-stone-800';

  const stageMotionClass =
    status === 'happy'
      ? 'h-44 w-full flex items-center justify-center transition-transform duration-300 scale-110 -translate-y-1'
      : status === 'nope'
      ? 'h-44 w-full flex items-center justify-center transition-transform duration-300 -translate-x-2 rotate-3'
      : 'h-44 w-full flex items-center justify-center transition-transform duration-300';

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-amber-200 max-w-lg mx-auto text-center">
      <div className="flex justify-between items-center mb-4">
        <span className="px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs sm:text-sm font-extrabold">
          ❤️ 배부른 공룡: {fedCount}마리
        </span>
        <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs sm:text-sm font-extrabold">
          🔥 연속 성공: {streak}회
        </span>
      </div>

      <div className={bubbleClass}>
        {status === 'happy' && '😍 "냠냠 정말 맛있어요! 나는 ' + target.diet + ' 공룡이에요!"'}
        {status === 'nope' && '😣 "우와앙, 나는 그 먹이를 먹지 않아요!"'}
        {status === 'hungry' && '🤤 "꼬르륵~ 배고파요! ' + target.name + '에게 밥을 주세요!"'}
      </div>

      <div className="bg-stone-100 rounded-3xl h-60 flex flex-col items-center justify-center p-5 mb-3 relative overflow-hidden">
        {flyingEmoji && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className={status === 'happy' ? 'text-6xl transition-all duration-500 scale-125 animate-bounce' : 'text-6xl transition-all duration-500 opacity-80'}>
              {status === 'happy' ? '💖' : flyingEmoji}
            </span>
          </div>
        )}

        <div className={stageMotionClass}>
          <DinoImage src={imageMap[target.wikiTitle]} dino={target} className="h-full w-full" />
        </div>

        <span className="mt-1 text-base font-black text-stone-800">
          {target.name} <span className="text-xs font-bold text-stone-400">({target.period} · {target.type})</span>
        </span>
      </div>

      {status !== 'happy' && (
        <div className="mb-4 min-h-7 flex items-center justify-center">
          {showHint ? (
            <p className="text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 py-1.5 px-3 rounded-xl">
              💡 단서: {getToothClue(target)}
            </p>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs font-extrabold text-indigo-600 hover:underline"
            >
              💡 어떤 밥을 좋아할지 힌트 보기
            </button>
          )}
        </div>
      )}

      {status !== 'happy' ? (
        <div className="grid grid-cols-3 gap-2.5">
          {FOODS.map((food) => (
            <button
              key={food.id}
              onClick={() => handleFeed(food)}
              className={'py-3.5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-xs ' + food.style}
            >
              <span className="text-3xl sm:text-4xl">{food.emoji}</span>
              <span className="font-black text-xs sm:text-sm">{food.label}</span>
              <span className="text-[11px] font-bold opacity-75">{food.sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5 mt-3">
          <p className="text-sm text-stone-700 bg-stone-50 border border-stone-200 p-3.5 rounded-2xl font-medium leading-relaxed">
            {target.description}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onOpenDetail && onOpenDetail(target)}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow transition"
            >
              🔍 도감 자세히 보기
            </button>
            <button
              onClick={nextDino}
              className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow transition"
            >
              🍖 다음 공룡 밥 주기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}