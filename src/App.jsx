import React, { useState, useMemo } from 'react';
import dinosData from './data/dinosaurs.json';
import { useDinoImages } from './hooks/useDinoImages';
import { matchKoreanSearch } from './utils/hangul';
import DinoImage from './components/DinoImage';
import DinoModal from './components/DinoModal';
import CompareModal from './components/CompareModal';
import SilhouetteQuiz from './components/SilhouetteQuiz';
import FossilDigGame from './components/FossilDigGame';
import DinoFeedGame from './components/DinoFeedGame';

const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const PERIODS = ['전체', '트라이아스기', '쥐라기', '백악기'];
const DOMAINS = ['전체', '땅', '하늘', '바다'];
const DIETS = ['전체', '육식', '초식', '잡식'];

export default function App() {
  const imageMap = useDinoImages(dinosData);

  const [mode, setMode] = useState('dex'); // 'dex' | 'quiz'
  const [search, setSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('전체');
  const [selectedDomain, setSelectedDomain] = useState('전체');
  const [selectedDiet, setSelectedDiet] = useState('전체');

  const [selectedDino, setSelectedDino] = useState(null);
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Web Speech API 한국어 음성 검색
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저에서는 음성 인식을 지원하지 않습니다. 크롬이나 사파리를 이용해 주세요.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.replace(/\s+/g, '');
      setSearch(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleToggleCompare = (dino) => {
    setCompareList((prev) => {
      if (prev.some((d) => d.id === dino.id)) {
        return prev.filter((d) => d.id !== dino.id);
      }
      if (prev.length >= 2) {
        return [prev[1], dino];
      }
      const next = [...prev, dino];
      if (next.length === 2) setShowCompareModal(true);
      return next;
    });
  };

  const filteredDinos = useMemo(() => {
    return dinosData.filter((dino) => {
      const okSearch = matchKoreanSearch(dino, search);
      const okPeriod = selectedPeriod === '전체' || dino.period === selectedPeriod;
      const okDomain = selectedDomain === '전체' || dino.domain === selectedDomain;
      const okDiet = selectedDiet === '전체' || dino.diet === selectedDiet;
      return okSearch && okPeriod && okDomain && okDiet;
    });
  }, [search, selectedPeriod, selectedDomain, selectedDiet]);

  return (
    <div className="min-h-screen bg-amber-50/40 pb-24">
      {/* 상단 고정 헤더 */}
      <header className="bg-emerald-700 text-white py-4 px-4 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🦖</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                우리 아이 공룡 도감
              </h1>
              <p className="text-xs text-emerald-200 font-semibold mt-0.5">
                땅·하늘·바다 중생대 친구들 {dinosData.length}종
              </p>
            </div>
          </div>

          <div className="flex flex-wrap bg-emerald-800 p-1 rounded-2xl gap-0.5">
  {[
    { id: 'dex', label: '📖 도감' },
    { id: 'quiz', label: '❓ 그림자 퀴즈' },
    { id: 'dig', label: '⛏️ 화석 발굴' },
    { id: 'feed', label: '🍖 밥 주기' },
  ].map((tab) => (
    <button
      key={tab.id}
      onClick={() => setMode(tab.id)}
      className={`px-3 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition ${
        mode === tab.id ? 'bg-white text-emerald-800 shadow' : 'text-emerald-100 hover:text-white'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6">
        {mode === 'quiz' ? (
          <SilhouetteQuiz dinos={dinosData} imageMap={imageMap} />
        ) : mode === 'dig' ? (
          <FossilDigGame
            dinos={dinosData}
            imageMap={imageMap}
            onOpenDetail={(dino) => setSelectedDino(dino)}
          />
        ) : mode === 'feed' ? (
          <DinoFeedGame
            dinos={dinosData}
            imageMap={imageMap}
            onOpenDetail={(dino) => setSelectedDino(dino)}
          />
        ) : (
          <>
            {/* 통합 검색 및 필터 패널 */}
            <section className="bg-white p-4 sm:p-5 rounded-3xl shadow-xs border border-emerald-100 mb-6">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="이름이나 초성 입력 (예: ㅌㄹㄴ, 코리아)"
                  className="flex-1 bg-stone-100 px-4 py-3 rounded-2xl text-sm sm:text-base font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleVoiceSearch}
                  title="음성으로 공룡 찾기"
                  className={`px-4 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-1 transition shadow-xs ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  🎙️ <span className="hidden sm:inline">{isListening ? '듣는 중...' : '음성 검색'}</span>
                </button>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-3.5 py-3 bg-stone-200 hover:bg-stone-300 rounded-2xl font-extrabold text-xs text-stone-700"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 원터치 초성 키패드 */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {CONSONANTS.map((char) => (
                  <button
                    key={char}
                    onClick={() => setSearch((prev) => prev + char)}
                    className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-200 text-emerald-900 font-black text-sm transition active:scale-90"
                  >
                    {char}
                  </button>
                ))}
              </div>

              {/* 시대 / 서식지 / 식성 3단 필터 */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-100 text-xs font-extrabold">
                <div className="flex flex-wrap gap-1.5">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p)}
                      className={`px-3 py-1.5 rounded-xl transition ${
                        selectedPeriod === p
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DOMAINS.map((dom) => (
                    <button
                      key={dom}
                      onClick={() => setSelectedDomain(dom)}
                      className={`px-3 py-1.5 rounded-xl transition ${
                        selectedDomain === dom
                          ? 'bg-sky-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {dom === '땅' ? '🌋 땅' : dom === '하늘' ? '☁️ 하늘' : dom === '바다' ? '🌊 바다' : '전체 무대'}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DIETS.map((diet) => (
                    <button
                      key={diet}
                      onClick={() => setSelectedDiet(diet)}
                      className={`px-3 py-1.5 rounded-xl transition ${
                        selectedDiet === diet
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {diet === '육식'
                        ? '🍖 육식'
                        : diet === '초식'
                        ? '🌿 초식'
                        : diet === '잡식'
                        ? '🥚 잡식'
                        : '전체 식성'}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 검색 결과 안내 */}
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm font-extrabold text-stone-600">
                총 <span className="text-emerald-700">{filteredDinos.length}마리</span>의 공룡을 찾았어요!
              </p>
              <p className="text-xs text-stone-400 font-bold">카드의 ⚖️ 버튼으로 두 마리 크기를 비교해 보세요</p>
            </div>

            {/* 공룡 카드 그리드 */}
            {filteredDinos.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-100">
                <p className="text-4xl mb-2">🦕</p>
                <p className="font-extrabold text-stone-700">조건에 맞는 공룡이 없어요.</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedPeriod('전체');
                    setSelectedDomain('전체');
                    setSelectedDiet('전체');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold"
                >
                  전체 공룡 다시 보기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredDinos.map((dino) => {
                  const isCompared = compareList.some((d) => d.id === dino.id);
                  return (
                    <div
                      key={dino.id}
                      onClick={() => setSelectedDino(dino)}
                      className={`bg-white rounded-3xl p-4 shadow-xs hover:shadow-md border transition cursor-pointer hover:-translate-y-1 flex flex-col relative ${
                        isCompared ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-stone-100'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-extrabold mb-2">
                        <span className="text-stone-400">No.{String(dino.id).padStart(3, '0')}</span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              dino.diet === '육식'
                                ? 'bg-rose-50 text-rose-600'
                                : dino.diet === '초식'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-purple-50 text-purple-600'
                            }`}
                          >
                            {dino.diet}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompare(dino);
                            }}
                            title="크기 비교 담기"
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition ${
                              isCompared
                                ? 'bg-indigo-600 text-white'
                                : 'bg-stone-100 hover:bg-indigo-100 text-stone-600'
                            }`}
                          >
                            ⚖️
                          </button>
                        </div>
                      </div>

                      <div className="h-36 bg-stone-50 rounded-2xl mb-3 flex items-center justify-center p-2 overflow-hidden">
                        <DinoImage src={imageMap[dino.wikiTitle]} dino={dino} className="h-full w-full" />
                      </div>

                      <h2 className="text-base sm:text-lg font-black text-stone-800 truncate">{dino.name}</h2>
                      <p className="text-xs text-stone-400 font-bold mt-0.5">
                        {dino.period} · {dino.domain} · {dino.lengthM}m
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* 하단 플로팅 1:1 비교 트레이 */}
      {/* {compareList.length > 0 && ( */}
      {mode === 'dex' && compareList.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto bg-indigo-950 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 z-40">
          <div className="text-xs sm:text-sm font-bold truncate">
            ⚖️ 비교 선택: {compareList.map((d) => d.name).join(' vs ')}
            {compareList.length === 1 && ' (한 마리 더 선택!)'}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {compareList.length === 2 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-3 py-1.5 bg-amber-400 text-indigo-950 rounded-xl text-xs font-black"
              >
                비교하기
              </button>
            )}
            <button
              onClick={() => setCompareList([])}
              className="px-2.5 py-1.5 bg-indigo-800 hover:bg-indigo-700 rounded-xl text-xs font-bold"
            >
              비우기
            </button>
          </div>
        </div>
      )}

      {/* 상세 모달 및 1:1 크기 비교 모달 */}
      <DinoModal
        dino={selectedDino}
        imageUrl={selectedDino ? imageMap[selectedDino.wikiTitle] : null}
        onClose={() => setSelectedDino(null)}
        onAddCompare={handleToggleCompare}
      />

      {showCompareModal && (
        <CompareModal
          pair={compareList}
          imageMap={imageMap}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}