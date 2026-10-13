import { useState, useRef, useEffect } from "react";
import { Zap, RefreshCw, UploadCloud, Package, AlertTriangle, Link as LinkIcon, Sparkles } from "lucide-react";
import { RATIOS, Ratio, RenderOpts, renderArtwork, exportArtwork, extractDominantColor, validateImage, isValidSpotifyTrackUrl } from "./lib/renderer";

const label = "block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5";
const input = "w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition-colors";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [song, setSong] = useState("MONTAGEM SUMAQ");
  const [artist, setArtist] = useState("Hogeraki");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [color, setColor] = useState("#ef4444");
  const [current, setCurrent] = useState("1:39");
  const [total, setTotal] = useState("2:00");
  const [tag, setTag] = useState("ffansik x lphonk");
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [ratio, setRatio] = useState<Ratio>("9:16");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const previewRef = useRef<HTMLCanvasElement>(null);

  const handleSpotifyImport = async (url: string) => {
    if (!isValidSpotifyTrackUrl(url)) {
      setError("Введите корректную ссылку на трек Spotify (https://open.spotify.com/track/...)");
      return;
    }
    setError("");
    setSuccessMsg("");
    setBusy(true);
    try {
      const oembedApi = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await fetch(oembedApi);
      if (!response.ok) throw new Error("Не удалось загрузить метаданные Spotify");

      const data = await response.json();
      
      if (data) {
        if (data.title) setSong(data.title.split(" - ")[0].trim());
        if (data.author_name) {
          setArtist(data.author_name);
        } else if (data.title && data.title.includes(" - ")) {
          setArtist(data.title.split(" - ")[1]?.trim() || "Spotify Artist");
        }

        setSuccessMsg(`Импортировано успешно!`);

        if (data.thumbnail_url) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            setImage(img);
            setColor(extractDominantColor(img));
            setBusy(false);
          };
          img.onerror = () => {
            setError("Обложка заблокирована CORS — загрузите файл вручную.");
            setBusy(false);
          };
          img.src = data.thumbnail_url;
        } else {
          setBusy(false);
        }
      }
    } catch {
      setError("Ошибка импорта. Проверьте ссылку или загрузите обложку вручную.");
      setBusy(false);
    }
  };

  const handleAiGeneration = async (style: string) => {
    setAiGenerating(true);
    setError("");
    try {
      const res = await fetch('/api/generate-ai-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          style, 
          prompt: `Phonk music cover art, 8K render, ${style} aesthetic, cinematic neon lighting` 
        })
      });

      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Ошибка генерации");
      }

      if (data.imageBase64) {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setColor(extractDominantColor(img));
          setAiGenerating(false);
        };
        img.src = data.imageBase64;
      }
    } catch (err: any) {
      setAiGenerating(false);
      setError(err.message || "Сбой AI генерации. Проверьте переменные окружения в Vercel.");
    }
  };

  const opts = (): RenderOpts => ({
    image,
    ratio,
    song: song || "LPHONK TRACK",
    artist: artist || "LPHONK",
    color,
    current: current || "0:00",
    total: total || "0:00",
    tag,
    showPlayerDetails,
    trackUrl: spotifyUrl
  });

  useEffect(() => {
    let isMounted = true;
    if (previewRef.current) {
      renderArtwork(previewRef.current, opts()).catch((err) => {
        if (isMounted) console.error("Ошибка рендеринга:", err);
      });
    }
    return () => { isMounted = false; };
  }, [image, ratio, song, artist, color, current, total, tag, showPlayerDetails, spotifyUrl]);

  const fname = (r: Ratio) => `${(song || "lphonk_track").replace(/\s+/g, "_")}_${r.replace(":", "x")}.jpg`;

  const handleDownload = async (all = false) => {
    setBusy(true);
    try {
      for (const r of all ? RATIOS : [ratio]) {
        const renderOpts = { ...opts(), ratio: r };
        download(await exportArtwork(renderOpts), fname(r));
        if (all) await new Promise((res) => setTimeout(res, 300));
      }
    } finally { setBusy(false); }
  };

  const aspect = { "9:16": "aspect-[9/16] max-w-[260px]", "16:9": "aspect-video max-w-full", "3:4": "aspect-[3/4] max-w-[320px]", "1:1": "aspect-square max-w-[340px]" }[ratio];

  return (
    <div className="min-h-screen bg-black py-10 px-4 text-white">
      <div className="max-w-5xl mx-auto p-6 bg-zinc-950 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
          <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20"><Zap className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LPhonk Spotify Pro — AI Studio</h1>
            <p className="text-xs text-zinc-400">Spotify Link Fetcher · AI Cover Studio · Real QR Code</p>
          </div>
        </div>

        {/* Импорт Spotify */}
        <div className="mb-6 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <label className={label}>Импорт по ссылке Spotify</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input 
                className={input + " pl-10"} 
                value={spotifyUrl} 
                onChange={(e) => setSpotifyUrl(e.target.value)} 
                placeholder="https://open.spotify.com/track/..." 
              />
            </div>
            <button 
              onClick={() => handleSpotifyImport(spotifyUrl)}
              disabled={busy || !spotifyUrl}
              className="px-6 bg-green-600 hover:bg-green-500 disabled:opacity-50 font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
              {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Импорт
            </button>
          </div>
          {successMsg && <p className="mt-2 text-xs text-green-400">✓ {successMsg}</p>}
          {error && <p className="mt-2 text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
        </div>

        {/* AI Cover Studio */}
        <div className="mb-6 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
          <span className={label}>AI Cover Studio — Генерация обложек</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
            <button onClick={() => handleAiGeneration('phonk')} disabled={aiGenerating} className="p-3 bg-red-950/40 hover:bg-red-900/40 border border-red-900/50 rounded-xl text-left transition-colors flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-red-400">🔥 PHONK AI</p>
                <p className="text-[10px] text-zinc-400">Красный неон</p>
              </div>
              {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-red-400" /> : <Sparkles className="w-4 h-4 text-red-400" />}
            </button>

            <button onClick={() => handleAiGeneration('brazilian')} disabled={aiGenerating} className="p-3 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-900/50 rounded-xl text-left transition-colors flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-400">💜 Brazilian Funk AI</p>
                <p className="text-[10px] text-zinc-400">Фиолетовый неон</p>
              </div>
              {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-purple-400" /> : <Sparkles className="w-4 h-4 text-purple-400" />}
            </button>

            <button onClick={() => handleAiGeneration('montagem')} disabled={aiGenerating} className="p-3 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-900/50 rounded-xl text-left transition-colors flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-cyan-400">⚡ MONTAGEM AI</p>
                <p className="text-[10px] text-zinc-400">Киберпанк 3D</p>
              </div>
              {aiGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
            </button>
          </div>
        </div>

        {/* Выбор формата */}
        <div className="mb-6">
          <span className={label}>Формат карточки</span>
          <div className="grid grid-cols-4 gap-2">
            {RATIOS.map((r) => (
              <button key={r} onClick={() => setRatio(r)}
                className={`py-2.5 rounded-xl font-medium text-sm transition-all border ${ratio === r ? "bg-red-500 border-red-500 shadow-lg shadow-red-500/25" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Название песни</label>
                <input className={input} value={song} onChange={(e) => setSong(e.target.value)} /></div>
              <div><label className={label}>Артист / Автор</label>
                <input className={input} value={artist} onChange={(e) => setArtist(e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><label className={label}>Тег (Пиллюля)</label>
                <input className={input} value={tag} onChange={(e) => setTag(e.target.value)} /></div>
              <div><label className={label}>Текущее время</label>
                <input className={input + " text-center"} value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
              <div><label className={label}>Общее время</label>
                <input className={input + " text-center"} value={total} onChange={(e) => setTotal(e.target.value)} /></div>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <span className="text-xs font-semibold text-zinc-300">Режим отображения плеера (Back Card)</span>
              <input 
                type="checkbox" 
                checked={showPlayerDetails} 
                onChange={(e) => setShowPlayerDetails(e.target.checked)} 
                className="w-5 h-5 accent-red-500 cursor-pointer" 
              />
            </div>

            <div>
              <span className={label}>Загрузить обложку вручную</span>
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl cursor-pointer transition-colors">
                <UploadCloud className="w-7 h-7 mb-1 text-zinc-400" />
                <p className="text-xs text-zinc-400"><span className="font-semibold text-zinc-200">Нажмите</span> для выбора файла</p>
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    try {
                      const img = await validateImage(e.target.files[0]);
                      setImage(img);
                      setColor(extractDominantColor(img));
                    } catch (err) { setError((err as Error).message); }
                  }
                }} />
              </label>
            </div>

            <button onClick={() => handleDownload(false)} disabled={busy}
              className="w-full py-4 bg-red-500 hover:bg-red-600 font-bold rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2">
              {busy ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              Скачать карточку ({ratio})
            </button>
            <button onClick={() => handleDownload(true)} disabled={busy}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm">
              <Package className="w-4 h-4" /> Скачать все 4 формата сразу
            </button>
          </div>

          <div className="flex flex-col items-center justify-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6">
            <span className="text-xs font-medium text-zinc-400 mb-4 uppercase tracking-wider">Живой предпросмотр ({ratio})</span>
            <div className={`w-full ${aspect} rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 flex items-center justify-center`}>
              <canvas ref={previewRef} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
