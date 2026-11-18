import React, { useState, useEffect, useRef, useCallback } from 'react';
import DinoImage from './DinoImage';
import { speakKorean, stopSpeaking } from '../utils/tts';

const STORAGE_KEY = 'dino_kids_excavated_ids_v1';
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 280;
const CLEAR_THRESHOLD = 65; // 65% 이상 긁어내면 자동 발굴 완료

// Web Audio API로 간단한 효과음 생성 (외부 mp3 불필요)
function playDigSound(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === 'hammer') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'clear') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // 도
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // 미
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // 솔
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch {
    // 오디오 컨텍스트 제한 시 무시
  }
}

export default function FossilDigGame({ dinos, imageMap, onOpenDetail }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const strokeCountRef = useRef(0);

  const [target, setTarget] = useState(null);
  const [tool, setTool] = useState('brush'); // 'brush' (솔) | 'hammer' (망치)
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [excavatedIds, setExcavatedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 모래 바위 질감을 캔버스에 그리기
  const drawSandRockLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.globalCompositeOperation = 'source-over';

    // 1. 기본 사암 그라데이션 배경
    const grad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    grad.addColorStop(0, '#d6b384');
    grad.addColorStop(0.5, '#c29b68');
    grad.addColorStop(1, '#a67f4e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. 지층 줄무늬 표현
    ctx.strokeStyle = 'rgba(120, 82, 40, 0.22)';
    ctx.lineWidth = 6;
    for (let y = 25; y < CANVAS_HEIGHT; y += 38) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(120, y - 10, 240, y + 12, CANVAS_WIDTH, y - 4);
      ctx.stroke();
    }

    // 3. 울퉁불퉁한 돌멩이와 모래 입자 표현
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const r = Math.random() * 3.5 + 1;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 243, 219, 0.35)' : 'rgba(92, 61, 28, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 바위 균열 무늬 및 안내 문구
    ctx.fillStyle = 'rgba(74, 48, 20, 0.75)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪨 바위를 터치하거나 문질러 보세요!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 6);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = 'rgba(74, 48, 20, 0.55)';
    ctx.fillText('숨겨진 공룡 화석이 나타납니다', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 18);
  }, []);

  // 새 화석 스테이지 시작
  const startNewDig = useCallback(() => {
    stopSpeaking();
    const pool = dinos.filter((d) => imageMap[d.wikiTitle]);
    const source = pool.length > 0 ? pool : dinos;
    const randomDino = source[Math.floor(Math.random() * source.length)];

    setTarget(randomDino);
    setProgress(0);
    setIsCompleted(false);
    strokeCountRef.current = 0;

    setTimeout(() => {
      drawSandRockLayer();
    }, 30);
  }, [dinos, imageMap, drawSandRockLayer]);

  useEffect(() => {
    startNewDig();
    return () => stopSpeaking();
  }, [startNewDig]);

  // 발굴 진행률(%) 계산 (알파 채널 투명도 체크)
  const checkDigProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted) return;
    const ctx = canvas.getContext('2d');
    const { data } = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let transparentPixels = 0;
    const step = 16; // 연산 최적화를 위해 4픽셀 간격 샘플링
    const totalSampled = data.length / step;

    for (let i = 3; i < data.length; i += step) {
      if (data[i] < 128) transparentPixels++;
    }

    const pct = Math.min(100, Math.round((transparentPixels / totalSampled) * 100));
    setProgress(pct);

    if (pct >= CLEAR_THRESHOLD) {
      completeExcavation();
    }
  };

  // 발굴 성공 처리
  const completeExcavation = () => {
    setIsCompleted(true);
    setProgress(100);
    playDigSound('clear');

    // 남은 모래 전체 제거
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (target) {
      setExcavatedIds((prev) => {
        if (prev.includes(target.id)) return prev;
        const updated = [...prev, target.id];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // 저장 실패 무시
        }
        return updated;
      });

      speakKorean(
        `우와! 화석 발굴 성공! ${target.period}의 ${target.name}가 나타났어요! 뜻은 ${target.meaning}입니다.`
      );
    }
  };

  // 캔버스 좌표 변환
  const getPointerPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // 모래 깎아내기 실행
  const scratchAt = (x, y, mode) => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted) return;
    const ctx = canvas.getContext('2d');

    ctx.globalCompositeOperation = 'destination-out';

    if (mode === 'hammer') {
      // 망치: 울퉁불퉁한 바위 조각 형태로 크게 깨짐
      playDigSound('hammer');
      ctx.beginPath();
      ctx.arc(x, y, 36, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 + Math.random();
        const dist = 24 + Math.random() * 16;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      checkDigProgress();
    } else {
      // 솔(붓): 부드럽게 문질러 닦아냄
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fill();

      strokeCountRef.current += 1;
      if (strokeCountRef.current % 8 === 0) {
        checkDigProgress();
      }
    }
  };

  const handlePointerDown = (e) => {
    if (isCompleted) return;
    isDrawingRef.current = true;
    const { x, y } = getPointerPos(e);
    scratchAt(x, y, tool);
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current || isCompleted || tool === 'hammer') return;
    const { x, y } = getPointerPos(e);
    scratchAt(x, y, 'brush');
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    checkDigProgress();
  };

  if (!target) return null;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-amber-200 max-w-lg mx-auto">
      {/* 상단 발굴 현황 배지 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs sm:text-sm font-extrabold">
          🦴 발굴 도감: {excavatedIds.length} / {dinos.length}종
        </span>
        <span className="px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs sm:text-sm font-extrabold">
          ⛏️ 발굴 진행률: {progress}%
        </span>
      </div>

      {/* 타이틀 안내 */}
      <div className="text-center mb-4">
        <h2 className="text-xl sm:text-2xl font-black text-stone-800">
          {isCompleted ? `🎉 ${target.name} 발굴 완료!` : '모래 바위 속 화석을 발굴해 보세요!'}
        </h2>
        <p className="text-xs font-bold text-stone-500 mt-1">
          {isCompleted
            ? `${target.period} · ${target.meaning} (${target.lengthM}m)`
            : `지층 단서: ${target.period} 지층 · ${target.habitat} 지역`}
        </p>
      </div>

      {/* 도구 선택 스위치 */}
      {!isCompleted && (
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button
            onClick={() => setTool('hammer')}
            className={`py-2.5 px-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition border ${
              tool === 'hammer'
                ? 'bg-amber-600 text-white border-amber-600 shadow'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            🔨 망치로 쿵쿵 깨기
          </button>
          <button
            onClick={() => setTool('brush')}
            className={`py-2.5 px-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-1.5 transition border ${
              tool === 'brush'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            🖌️ 솔로 쓱싹 털기
          </button>
        </div>
      )}

      {/* 화석 발굴 캔버스 스테이지 */}
      <div className="relative w-full max-w-[360px] aspect-[360/280] mx-auto rounded-3xl overflow-hidden border-4 border-amber-800/30 bg-stone-200 shadow-inner select-none mb-5">
        {/* 바닥 레이어: 발굴 중엔 화석 석판 느낌(세피아+고대비), 완료 시 원래 공룡 복원도 */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center p-5 transition-all duration-700 ${
            isCompleted ? 'bg-amber-50/70 scale-105' : 'bg-stone-300'
          }`}
        >
          <div
            className={`w-full h-full flex items-center justify-center transition-all duration-700 ${
              isCompleted ? 'filter-none' : 'sepia contrast-150 brightness-75 opacity-90'
            }`}
          >
            <DinoImage
              src={imageMap[target.wikiTitle]}
              dino={target}
              className="h-full w-full"
            />
          </div>
        </div>

        {/* 상단 레이어: 손가락으로 문질러 지우는 모래 바위 캔버스 */}
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`absolute inset-0 w-full h-full touch-none transition-opacity duration-500 ${
            isCompleted ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
          }`}
        />
      </div>

      {/* 진행률 게이지 바 */}
      {!isCompleted && (
        <div className="mb-4">
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-amber-500 h-3 rounded-full transition-all duration-200"
              style={{ width: `${Math.min(100, Math.round((progress / CLEAR_THRESHOLD) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-center text-stone-400 font-bold mt-1.5">
            모래를 조금만 더 털어내면 공룡이 깨어나요!
          </p>
        </div>
      )}

      {/* 발굴 완료 후 액션 버튼 */}
      {isCompleted && (
        <div className="space-y-2.5">
          <p className="text-sm text-stone-700 bg-amber-50 border border-amber-100 p-3.5 rounded-2xl font-medium leading-relaxed">
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
              onClick={startNewDig}
              className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow transition"
            >
              ⛏️ 다른 화석 발굴하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}