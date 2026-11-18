export function stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
  
  export function speakKorean(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
  
    // 기기에 설치된 깔끔한 한국어 표준 음성 우선 선택
    const voices = window.speechSynthesis.getVoices();
    const koVoice = voices.find((v) => v.lang.includes('ko'));
    if (koVoice) utterance.voice = koVoice;
  
    window.speechSynthesis.speak(utterance);
  }