import { useState, useEffect } from 'react';

const CACHE_KEY = 'dino_kids_pokedex_images_v1';

export function useDinoImages(dinos) {
  const [imageMap, setImageMap] = useState(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    let isMounted = true;
    const missing = dinos.filter((d) => !imageMap[d.wikiTitle]);
    if (missing.length === 0) return;

    async function fetchBatch() {
      const updated = { ...imageMap };
      for (let i = 0; i < missing.length; i += 8) {
        const chunk = missing.slice(i, i + 8);
        await Promise.all(
          chunk.map(async (dino) => {
            try {
              const res = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(dino.wikiTitle)}`
              );
              if (!res.ok) return;
              const data = await res.json();
              const imgUrl = data?.thumbnail?.source || data?.originalimage?.source;
              if (imgUrl) {
                updated[dino.wikiTitle] = imgUrl;
              }
            } catch {
              // 오프라인 등 실패 시 기본 아이콘 유지
            }
          })
        );

        if (isMounted) {
          setImageMap({ ...updated });
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
          } catch {
            // 용량 초과 예외 무시
          }
        }
      }
    }

    fetchBatch();
    return () => {
      isMounted = false;
    };
  }, [dinos]);

  return imageMap;
}