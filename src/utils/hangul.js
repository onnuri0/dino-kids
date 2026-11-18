const CHOSUNG_LIST = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
    'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  
  export function getChosung(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) - 44032;
      if (code >= 0 && code <= 11171) {
        result += CHOSUNG_LIST[Math.floor(code / 588)];
      } else {
        result += str.charAt(i);
      }
    }
    return result;
  }
  
  export function matchKoreanSearch(dino, query) {
    if (!query) return true;
    const cleanQuery = query.replace(/\s+/g, '').toLowerCase();
    const cleanName = dino.name.replace(/\s+/g, '').toLowerCase();
    const cleanEng = dino.englishName.toLowerCase();
  
    if (cleanName.includes(cleanQuery) || cleanEng.includes(cleanQuery)) {
      return true;
    }
    return getChosung(cleanName).includes(cleanQuery);
  }