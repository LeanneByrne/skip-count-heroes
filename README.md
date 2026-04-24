# 🎵 Skip Count Heroes

A React app that helps kids learn skip counting through nursery rhyme melodies, interactive practice, and karaoke-style sing-alongs.

## ✨ Features

- **🎯 Practice Mode** — Fill in the missing numbers in a sequence. Each correct answer plays an ascending musical note.
- **⚡ Quiz Mode** — Multiple-choice speed rounds with drumrolls and streak bonuses.
- **🎵 Music Mode** — A different public-domain nursery rhyme for every counting number, with karaoke-style bouncing ball visuals so kids can sing along.

## 🎶 The Tunes

Each counting number plays its own classic nursery rhyme:

| Count by | Song |
|----------|---------------------------|
| 2s | Twinkle Twinkle Little Star |
| 3s | Mary Had a Little Lamb |
| 4s | Row Row Row Your Boat |
| 5s | London Bridge |
| 6s | Frère Jacques |
| 7s | Hot Cross Buns |
| 8s | Yankee Doodle |
| 9s | This Old Man |
| 10s | Old MacDonald |
| 11s | Three Blind Mice |
| 12s | Pop Goes the Weasel |

All melodies are traditional folk tunes in the public domain.

## 🛠️ Built With

- [React](https://react.dev) — UI framework
- [Vite](https://vitejs.dev) — build tool and dev server
- [Tone.js](https://tonejs.github.io) — web audio synthesis
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Lucide React](https://lucide.dev) — icons

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS version)

### Installation

Clone the repo and install dependencies:

    git clone https://github.com/LeanneByrne/skip-count-heroes.git
    cd skip-count-heroes
    npm install

Start the dev server:

    npm run dev

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🎙️ Optional: AI Voice Sync

Music Mode supports playing synced voice clips alongside the melody. To enable:

1. Generate MP3s for each number (2.mp3, 4.mp3, etc.) using a service like [TTSMaker](https://ttsmaker.com) or [ElevenLabs](https://elevenlabs.io)
2. Host them somewhere public — [Netlify Drop](https://app.netlify.com/drop) works great for free
3. In the app, expand "🎙️ AI Voice" in Music Mode and paste your folder URL

The voice clips trigger on the same audio clock as the melody, so sync is perfect.

## 📝 License

MIT — free to use, modify, and share.

## 💛 Acknowledgments

Made for future math whizzes.