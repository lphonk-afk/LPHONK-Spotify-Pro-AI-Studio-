import { useState } from 'react';

export default function App() {
const [song, setSong] = useState('');
const [artist, setArtist] = useState('');
const [style, setStyle] = useState('PHONK');
const [prompt, setPrompt] = useState('');
const [cover, setCover] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

async function generateCover() {
setError('');
setCover('');

if (!song.trim()) {
  setError('Введите название трека.');
  return;
}

setLoading(true);

try {
  const response = await fetch('/api/generate-ai-cover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      song,
      artist,
      style,
      prompt: prompt || `${style} music cover, cinematic lighting, detailed artwork, square album cover`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось создать обложку.');
  }

  const image = data.imageBase64 || data.image || data.url;

  if (!image) {
    throw new Error('API не вернул изображение. Проверь настройки API.');
  }

  setCover(
    image.startsWith('data:') || image.startsWith('http')
      ? image
      : `data:image/png;base64,${image}`
  );
} catch (e) {
  setError(e instanceof Error ? e.message : 'Произошла ошибка.');
} finally {
  setLoading(false);
}

}

function downloadCover() {
if (!cover) return;

const link = document.createElement('a');
link.href = cover;
link.download = `${song || 'LPHONK'}-cover.png`;
document.body.appendChild(link);
link.click();
link.remove();

}

return (
<main style={{
minHeight: '100vh',
background: '#09090f',
color: '#fff',
fontFamily: 'Arial, sans-serif',
padding: '24px 16px',
boxSizing: 'border-box'
}}>
<div style={{ maxWidth: 600, margin: '0 auto' }}>
<header style={{ textAlign: 'center', padding: '22px 0' }}>
<div style={{ fontSize: 36 }}>⚡</div>
<h1 style={{ fontSize: 30, margin: '8px 0' }}>
LPHONK Spotify Pro
</h1>
<p style={{ color: '#aaa' }}>AI Studio — музыкальная обложка</p>
</header>

    <section style={{
      background: '#15151f',
      border: '1px solid #30303c',
      borderRadius: 18,
      padding: 20
    }}>
      <h2>Создать обложку</h2>

      <label htmlFor="song">Название трека</label>
      <input
        id="song"
        value={song}
        onChange={e => setSong(e.target.value)}
        placeholder="Например, LPHONK MONTAGEM"
        style={inputStyle}
      />

      <label htmlFor="artist">Исполнитель</label>
      <input
        id="artist"
        value={artist}
        onChange={e => setArtist(e.target.value)}
        placeholder="LPHONK"
        style={inputStyle}
      />

      <label htmlFor="style">Стиль музыки</label>
      <select
        id="style"
        value={style}
        onChange={e => setStyle(e.target.value)}
        style={inputStyle}
      >
        <option>PHONK</option>
        <option>Brazilian Funk</option>
        <option>MONTAGEM</option>
        <option>Dark Phonk</option>
        <option>Drift Phonk</option>
        <option>Funk</option>
        <option>Cyberpunk</option>
      </select>

      <label htmlFor="prompt">Описание обложки (необязательно)</label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Неоновый город, фиолетовый свет, спортивный автомобиль..."
        rows={3}
        style={{ ...inputStyle, resize: 'vertical' }}
      />

      <button
        onClick={generateCover}
        disabled={loading}
        style={{
          width: '100%',
          padding: 16,
          marginTop: 12,
          borderRadius: 12,
          border: 0,
          background: loading ? '#555' : '#8b5cf6',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 17,
          cursor: loading ? 'wait' : 'pointer'
        }}
      >
        {loading ? 'Создаём обложку…' : '⚡ Создать AI-обложку'}
      </button>

      {error && (
        <p role="alert" style={{ color: '#ff7777', marginTop: 16 }}>
          {error}
        </p>
      )}
    </section>

    {cover && (
      <section style={{ marginTop: 24, textAlign: 'center' }}>
        <h2>{song}</h2>
        <p style={{ color: '#aaa' }}>{artist}</p>
        <img
          src={cover}
          alt="Созданная музыкальная обложка"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 500,
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: 16,
            margin: '16px auto'
          }}
        />
        <button onClick={downloadCover} style={buttonStyle}>
          Скачать обложку PNG
        </button>
      </section>
    )}

    <footer style={{
      textAlign: 'center',
      color: '#777',
      fontSize: 12,
      marginTop: 36
    }}>
      LPHONK • AI Music Cover Studio
    </footer>
  </div>
</main>

);
}

const inputStyle = {
display: 'block',
boxSizing: 'border-box' as const,
width: '100%',
margin: '8px 0 18px',
padding: 13,
borderRadius: 10,
border: '1px solid #393946',
background: '#0d0d15',
color: '#fff',
fontSize: 16
};

const buttonStyle = {
padding: '14px 20px',
borderRadius: 10,
border: 0,
background: '#8b5cf6',
color: '#fff',
fontSize: 16,
fontWeight: 'bold' as const
};
