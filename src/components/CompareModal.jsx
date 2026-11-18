import React from 'react';
import DinoImage from './DinoImage';
import { speakKorean } from '../utils/tts';

export default function CompareModal({ pair, imageMap, onClose }) {
  if (!pair || pair.length < 2) return null;
  const [left, right] = pair;

  const maxLen = Math.max(left.lengthM, right.lengthM, 10);
  const leftScale = Math.max((left.lengthM / maxLen) * 100, 18);
  const rightScale = Math.max((right.lengthM / maxLen) * 100, 18);

  const bigger = left.lengthM >= right.lengthM ? left : right;
  const diff = Math.abs(left.lengthM - right.lengthM).toFixed(1);

  const handleAnnounce = () => {
    if (left.lengthM === right.lengthM) {
      speakKorean(`${left.name}와 ${right.name}는 둘 다 ${left.lengthM}미터로 길이가 똑같아요!`);
    } else {
      speakKorean(
        `${bigger.name}가 ${diff}미터 더 길어요! ${left.name}는 ${left.lengthM}미터, ${right.name}는 ${right.lengthM}미터입니다.`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">⚖️ 누가 더 클까요? 1:1 크기 대결</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 font-bold text-stone-600"
          >
            ✕
          </button>
        </div>

        {/* 시각적 스케일 비교 무대 */}
        <div className="bg-stone-50 border border-stone-200 rounded-3xl h-64 px-4 pt-6 pb-3 flex items-end justify-around gap-4 mb-5 relative overflow-hidden">
          {[
            { dino: left, scale: leftScale, color: 'text-emerald-700' },
            { dino: right, scale: rightScale, color: 'text-indigo-700' },
          ].map(({ dino, scale, color }) => (
            <div key={dino.id} className="flex flex-col items-center justify-end h-full flex-1">
              <div
                className="flex items-end justify-center w-full transition-all duration-500"
                style={{ height: `${scale}%` }}
              >
                <DinoImage src={imageMap[dino.wikiTitle]} dino={dino} className="h-full w-full" />
              </div>
              <span className={`mt-2 font-extrabold text-sm sm:text-base ${color}`}>{dino.name}</span>
              <span className="text-xs text-stone-500 font-bold">
                {dino.lengthM}m · {dino.weightTon >= 1 ? `${dino.weightTon}톤` : `${Math.round(dino.weightTon * 1000)}kg`}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50 p-4 rounded-2xl">
          <p className="text-sm font-bold text-indigo-900 text-center sm:text-left">
            {left.lengthM === right.lengthM
              ? `두 공룡 모두 ${left.lengthM}m로 길이가 같아요!`
              : `🏆 ${bigger.name}가 약 ${diff}m 더 길어요!`}
          </p>
          <button
            onClick={handleAnnounce}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow"
          >
            🔊 결과 들어보기
          </button>
        </div>
      </div>
    </div>
  );
}