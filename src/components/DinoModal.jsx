import React, { useEffect } from 'react';
import DinoImage from './DinoImage';
import { speakKorean, stopSpeaking } from '../utils/tts';

export default function DinoModal({ dino, imageUrl, onClose, onAddCompare }) {
  useEffect(() => {
    return () => stopSpeaking();
  }, [dino]);

  if (!dino) return null;

  const maxScale = Math.max(dino.lengthM, 12);
  const dinoPct = Math.min((dino.lengthM / maxScale) * 100, 100);
  const busPct = Math.min((10 / maxScale) * 100, 100);
  const humanPct = Math.max((1.7 / maxScale) * 100, 4);

  const handleSpeak = () => {
    const weightText =
      dino.weightTon >= 1
        ? `약 ${dino.weightTon}톤`
        : `약 ${Math.round(dino.weightTon * 1000)}킬로그램`;
    const script = `${dino.name}! 이름의 뜻은 ${dino.meaning}입니다. ${dino.period} 시대에 ${dino.domain}에서 살았던 ${dino.diet} 동물이에요. 몸길이는 ${dino.lengthM}미터, 몸무게는 ${weightText}입니다. ${dino.description}`;
    speakKorean(script);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center"
        >
          ✕
        </button>

        {/* 분류 배지 */}
        <div className="flex flex-wrap gap-1.5 mb-3 pr-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            {dino.period}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              dino.diet === '육식'
                ? 'bg-rose-100 text-rose-700'
                : dino.diet === '초식'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {dino.diet} · {dino.type}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
            📍 {dino.habitat}
          </span>
        </div>

        {/* 타이틀 및 액션 버튼 */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">{dino.name}</h2>
            <p className="text-sm text-stone-500 font-medium">
              {dino.englishName} · "{dino.meaning}"
            </p>
          </div>
          <button
            onClick={handleSpeak}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow active:scale-95 transition"
          >
            🔊 읽어주기
          </button>
        </div>

        {/* 이미지 박스 */}
        <div className="bg-stone-50 border border-stone-100 rounded-2xl h-56 flex items-center justify-center p-4 mb-4">
          <DinoImage src={imageUrl} dino={dino} className="h-full w-full" />
        </div>

        {/* 핵심 수치 요약 */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-stone-50 p-2.5 rounded-2xl">
            <p className="text-xs text-stone-400 font-bold">몸길이</p>
            <p className="text-base font-extrabold text-stone-800">{dino.lengthM}m</p>
          </div>
          <div className="bg-stone-50 p-2.5 rounded-2xl">
            <p className="text-xs text-stone-400 font-bold">몸무게</p>
            <p className="text-base font-extrabold text-stone-800">
              {dino.weightTon >= 1 ? `${dino.weightTon}톤` : `${Math.round(dino.weightTon * 1000)}kg`}
            </p>
          </div>
          <div className="bg-stone-50 p-2.5 rounded-2xl">
            <p className="text-xs text-stone-400 font-bold">활동 무대</p>
            <p className="text-base font-extrabold text-stone-800">{dino.domain}</p>
          </div>
        </div>

        {/* 어린이 눈높이 설명 */}
        <p className="text-stone-700 leading-relaxed bg-amber-50/80 border border-amber-100 p-4 rounded-2xl mb-4 text-sm sm:text-base font-medium">
          {dino.description}
        </p>

        {/* 크기 비교 그래프 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4">
          <h3 className="text-xs font-extrabold text-slate-600 mb-3">📏 스쿨버스·어른과 몸길이 비교</h3>
          <div className="space-y-2.5 text-xs font-bold">
            <div>
              <div className="flex justify-between mb-1 text-emerald-700">
                <span>🦖 {dino.name}</span>
                <span>{dino.lengthM}m</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${dinoPct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-amber-700">
                <span>🚌 대형 스쿨버스</span>
                <span>10.0m</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: `${busPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-slate-600">
                <span>🧍 성인 평균 키</span>
                <span>1.7m</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className="bg-slate-500 h-2.5 rounded-full" style={{ width: `${humanPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            onAddCompare(dino);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-sm transition"
        >
          ⚖️ 다른 공룡과 1:1 크기 맞비교 담기
        </button>
      </div>
    </div>
  );
}