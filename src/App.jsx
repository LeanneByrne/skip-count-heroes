import React, { useState, useEffect, useRef, useCallback } from "react";
import * as Tone from "tone";
import { Volume2, Play, Check, X, RotateCcw, Sparkles, Target, Zap, Music, Drum } from "lucide-react";

export default function App() {
  const [mode, setMode] = useState("practice");
  const [selectedNumber, setSelectedNumber] = useState(2);
  const [customNumber, setCustomNumber] = useState("");
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);

  // Practice mode state
  const [practiceSequence, setPracticeSequence] = useState([]);
  const [hiddenIndices, setHiddenIndices] = useState([]);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceResults, setPracticeResults] = useState({});
  const [practiceChecked, setPracticeChecked] = useState(false);

  // Quiz mode state
  const [quizQuestion, setQuizQuestion] = useState(null);
  const [quizChoices, setQuizChoices] = useState([]);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);

  // Listen/Music mode state
  const [listenIndex, setListenIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(110);
  const [drumsOn, setDrumsOn] = useState(true);
  const [instrument, setInstrument] = useState("marimba");
  const [melodyStyle, setMelodyStyle] = useState("melody");
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceBaseUrl, setVoiceBaseUrl] = useState("/audio");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const voicePlayersRef = useRef({});
  const playTimeoutRef = useRef(null);

  // Tone.js refs
  const synthRef = useRef(null);
  const marimbaRef = useRef(null);
  const bellsRef = useRef(null);
  const chordSynthRef = useRef(null);
  const kickRef = useRef(null);
  const hihatRef = useRef(null);
  const snareRef = useRef(null);
  const wrongSynthRef = useRef(null);

  const presetNumbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const TUNES = {
    2:  { name: "Twinkle Twinkle Little Star",
          notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4"] },
    3:  { name: "Mary Had a Little Lamb",
          notes: ["E4", "D4", "C4", "D4", "E4", "E4", "E4", "D4", "D4", "D4"] },
    4:  { name: "Row Row Row Your Boat",
          notes: ["C4", "C4", "C4", "D4", "E4", "E4", "D4", "E4", "F4", "G4"] },
    5:  { name: "London Bridge",
          notes: ["G4", "A4", "G4", "F4", "E4", "F4", "G4", "D4", "E4", "F4"] },
    6:  { name: "Frère Jacques",
          notes: ["C4", "D4", "E4", "C4", "C4", "D4", "E4", "C4", "E4", "F4"] },
    7:  { name: "Hot Cross Buns",
          notes: ["E4", "D4", "C4", "E4", "D4", "C4", "C4", "C4", "C4", "C4"] },
    8:  { name: "Yankee Doodle",
          notes: ["C4", "C4", "D4", "E4", "C4", "E4", "D4", "G3", "C4", "C4"] },
    9:  { name: "This Old Man",
          notes: ["G4", "E4", "G4", "G4", "E4", "G4", "A4", "G4", "F4", "E4"] },
    10: { name: "Old MacDonald",
          notes: ["C4", "C4", "C4", "G3", "A3", "A3", "G3", "E4", "E4", "D4"] },
    11: { name: "Three Blind Mice",
          notes: ["E4", "D4", "C4", "E4", "D4", "C4", "G4", "F4", "E4", "D4"] },
    12: { name: "Pop Goes the Weasel",
          notes: ["C4", "C4", "D4", "D4", "E4", "G4", "E4", "C4", "D4", "C4"] },
  };

  const ASCENDING = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"];

  const getTuneForNumber = (num) => {
    if (TUNES[num]) return TUNES[num];
    const keys = Object.keys(TUNES).map(Number);
    const tuneKey = keys[(num - 2) % keys.length] || 2;
    return TUNES[tuneKey];
  };

  const currentTune = getTuneForNumber(selectedNumber);

  const initAudio = useCallback(async () => {
    if (audioReady) return;
    await Tone.start();

    synthRef.current = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.3 },
    }).toDestination();
    synthRef.current.volume.value = -6;

    marimbaRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
    }).toDestination();
    marimbaRef.current.volume.value = -4;

    bellsRef.current = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 10,
      envelope: { attack: 0.001, decay: 0.5, sustain: 0.1, release: 1.2 },
      modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 },
    }).toDestination();
    bellsRef.current.volume.value = -10;

    chordSynthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.6 },
    }).toDestination();
    chordSynthRef.current.volume.value = -10;

    kickRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 },
    }).toDestination();
    kickRef.current.volume.value = -4;

    hihatRef.current = new Tone.MetalSynth({
      frequency: 300,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    hihatRef.current.volume.value = -22;

    snareRef.current = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
    }).toDestination();
    snareRef.current.volume.value = -14;

    wrongSynthRef.current = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 },
    }).toDestination();
    wrongSynthRef.current.volume.value = -12;

    setAudioReady(true);
  }, [audioReady]);

  const ensureAudio = async () => {
    if (!audioReady) await initAudio();
  };

  const getNoteForPosition = (position) => {
    if (melodyStyle === "ascending") {
      return ASCENDING[position % ASCENDING.length];
    }
    return currentTune.notes[position % currentTune.notes.length];
  };

  const playNote = (position, time) => {
    if (!musicEnabled) return;
    const note = getNoteForPosition(position);
    const target =
      instrument === "bells" ? bellsRef.current :
      instrument === "synth" ? synthRef.current :
      marimbaRef.current;
    if (!target) return;
    if (time !== undefined) {
      target.triggerAttackRelease(note, "8n", time);
    } else {
      target.triggerAttackRelease(note, "8n");
    }
  };

  const playCorrectChord = () => {
    if (!musicEnabled || !chordSynthRef.current) return;
    chordSynthRef.current.triggerAttackRelease(["C4", "E4", "G4", "C5"], "4n");
  };

  const playWinFanfare = () => {
    if (!musicEnabled || !chordSynthRef.current) return;
    const now = Tone.now();
    chordSynthRef.current.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
    chordSynthRef.current.triggerAttackRelease(["D4", "F4", "A4"], "8n", now + 0.15);
    chordSynthRef.current.triggerAttackRelease(["C4", "E4", "G4", "C5"], "4n", now + 0.3);
  };

  const playWrongSound = () => {
    if (!musicEnabled || !wrongSynthRef.current) return;
    const now = Tone.now();
    wrongSynthRef.current.triggerAttackRelease("E3", "16n", now);
    wrongSynthRef.current.triggerAttackRelease("Eb3", "16n", now + 0.1);
  };

  const playDrumroll = () => {
    if (!musicEnabled || !snareRef.current) return;
    const now = Tone.now();
    for (let i = 0; i < 6; i++) {
      snareRef.current.triggerAttackRelease("32n", now + i * 0.05);
    }
  };

  const playStreakStinger = (streakCount) => {
    if (!musicEnabled || !chordSynthRef.current) return;
    const now = Tone.now();
    if (streakCount >= 5) {
      chordSynthRef.current.triggerAttackRelease(["G4", "B4", "D5", "G5"], "8n", now);
      chordSynthRef.current.triggerAttackRelease(["A4", "C5", "E5", "A5"], "4n", now + 0.2);
    } else if (streakCount >= 3) {
      chordSynthRef.current.triggerAttackRelease(["E4", "G4", "C5"], "8n", now);
    }
  };

  const generateSequence = (num, length = 10) => {
    return Array.from({ length }, (_, i) => num * (i + 1));
  };

  const startPractice = () => {
    const seq = generateSequence(selectedNumber, 10);
    const numHidden = 4;
    const indices = new Set();
    while (indices.size < numHidden) {
      indices.add(Math.floor(Math.random() * 10));
    }
    setPracticeSequence(seq);
    setHiddenIndices(Array.from(indices));
    setPracticeAnswers({});
    setPracticeResults({});
    setPracticeChecked(false);
  };

  const checkPractice = async () => {
    await ensureAudio();
    const results = {};
    let correct = 0;
    const sortedHidden = [...hiddenIndices].sort((a, b) => a - b);

    sortedHidden.forEach((idx, i) => {
      const userAns = parseInt(practiceAnswers[idx]);
      const isRight = userAns === practiceSequence[idx];
      results[idx] = isRight;
      if (isRight) {
        correct++;
        setTimeout(() => playNote(idx), i * 180);
      }
    });

    setPracticeResults(results);
    setPracticeChecked(true);
    const allRight = correct === hiddenIndices.length;
    setScore((s) => ({ correct: s.correct + correct, total: s.total + hiddenIndices.length }));

    if (allRight) {
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      setTimeout(playWinFanfare, sortedHidden.length * 180 + 100);
    } else {
      setStreak(0);
      if (correct === 0) setTimeout(playWrongSound, 100);
    }
  };

  const generateQuiz = () => {
    const position = Math.floor(Math.random() * 12) + 1;
    const answer = selectedNumber * position;
    const choices = new Set([answer]);
    while (choices.size < 4) {
      const offset = Math.floor(Math.random() * 5) - 2;
      const wrongPos = Math.max(1, position + offset + (Math.random() > 0.5 ? 1 : -1));
      const wrong = selectedNumber * wrongPos;
      if (wrong !== answer && wrong > 0) choices.add(wrong);
    }
    while (choices.size < 4) {
      choices.add(answer + Math.floor(Math.random() * 10) + 1);
    }
    const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);
    setQuizQuestion({ position, answer });
    setQuizChoices(shuffled);
    setQuizSelected(null);
    setQuizFeedback(null);
    setTimeout(() => {
      if (audioReady) playDrumroll();
    }, 100);
  };

  const pickQuizAnswer = async (choice) => {
    if (quizSelected !== null) return;
    await ensureAudio();
    setQuizSelected(choice);
    const isRight = choice === quizQuestion.answer;
    setQuizFeedback(isRight ? "correct" : "wrong");
    setScore((s) => ({ correct: s.correct + (isRight ? 1 : 0), total: s.total + 1 }));

    if (isRight) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      playCorrectChord();
      if (newStreak >= 3) setTimeout(() => playStreakStinger(newStreak), 400);
    } else {
      setStreak(0);
      playWrongSound();
    }
    setTimeout(generateQuiz, 1600);
  };

  const stopMusic = useCallback(() => {
    if (playTimeoutRef.current) {
      playTimeoutRef.current.forEach((id) => clearTimeout(id));
      playTimeoutRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Object.values(voicePlayersRef.current).forEach((player) => {
      try { if (player.state === "started") player.stop(); } catch (e) {}
    });
    setIsPlaying(false);
    setListenIndex(-1);
  }, []);

  const preloadVoiceClips = async (numbers) => {
    if (!voiceBaseUrl.trim() || !voiceOn) return true;

    const baseUrl = voiceBaseUrl.trim().replace(/\/$/, "");
    setVoiceLoading(true);
    setVoiceError("");

    const uniqueNumbers = [...new Set(numbers)];
    const loadPromises = uniqueNumbers.map(async (num) => {
      if (voicePlayersRef.current[num]) return true;

      const url = `${baseUrl}/${num}.mp3`;
      return new Promise((resolve) => {
        try {
          const player = new Tone.Player({
            url,
            autostart: false,
            onload: () => {
              voicePlayersRef.current[num] = player;
              resolve(true);
            },
            onerror: (err) => {
              console.error(`Failed to load voice for ${num}:`, err);
              resolve(false);
            },
          }).toDestination();
          player.volume.value = 0;
        } catch (err) {
          console.error(`Error creating player for ${num}:`, err);
          resolve(false);
        }
      });
    });

    const results = await Promise.all(loadPromises);
    setVoiceLoading(false);

    const failed = uniqueNumbers.filter((_, i) => !results[i]);
    if (failed.length > 0) {
      setVoiceError(
        `Couldn't load ${failed.length} voice clip${failed.length > 1 ? "s" : ""}. ` +
        `Missing: ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "..." : ""}. ` +
        `Check that your URL is correct and files are named "NUMBER.mp3"`
      );
      return false;
    }
    return true;
  };

  const playMusicalSequence = async () => {
    if (isPlaying) {
      stopMusic();
      return;
    }
    await ensureAudio();

    const seq = generateSequence(selectedNumber, 10);

    if (voiceOn && voiceBaseUrl.trim()) {
      const loaded = await preloadVoiceClips(seq);
      if (!loaded) {
        console.warn("Voice clips failed to load; playing without voice.");
      }
    }

    setIsPlaying(true);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = tempo;

    const beatMs = 60000 / tempo;
    const uiTimeouts = [];

    seq.forEach((num, idx) => {
      const beatTime = `0:${idx}:0`;

      Tone.Transport.schedule((time) => {
        playNote(idx, time);
        if (drumsOn && musicEnabled) {
          if (kickRef.current) kickRef.current.triggerAttackRelease("C2", "8n", time);
          if (hihatRef.current) hihatRef.current.triggerAttackRelease("16n", time);
        }
        if (voiceOn && voicePlayersRef.current[num] && musicEnabled) {
          try {
            const player = voicePlayersRef.current[num];
            if (player.loaded) player.start(time);
          } catch (e) {
            console.warn(`Voice trigger error for ${num}:`, e);
          }
        }
      }, beatTime);

      if (drumsOn) {
        Tone.Transport.schedule((time) => {
          if (snareRef.current && musicEnabled) snareRef.current.triggerAttackRelease("16n", time);
          if (hihatRef.current && musicEnabled) hihatRef.current.triggerAttackRelease("16n", time);
        }, `0:${idx}:2`);
      }

      uiTimeouts.push(
        setTimeout(() => setListenIndex(idx), idx * beatMs)
      );
    });

    const totalDuration = seq.length * beatMs;
    Tone.Transport.schedule((time) => {
      if (chordSynthRef.current && musicEnabled) {
        chordSynthRef.current.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n", time);
      }
    }, `0:${seq.length}:0`);

    uiTimeouts.push(
      setTimeout(() => {
        setIsPlaying(false);
        setListenIndex(-1);
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }, totalDuration + 600)
    );

    playTimeoutRef.current = uiTimeouts;
    Tone.Transport.start();
  };

  const playSingleNote = async (num, idx) => {
    await ensureAudio();
    playNote(idx);
    if (voiceOn && voiceBaseUrl.trim()) {
      if (!voicePlayersRef.current[num]) {
        await preloadVoiceClips([num]);
      }
      const player = voicePlayersRef.current[num];
      if (player && player.loaded) {
        try { player.start(); } catch (e) {}
      }
    }
    setListenIndex(idx);
    setTimeout(() => setListenIndex(-1), 400);
  };

  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [stopMusic]);

  useEffect(() => {
    stopMusic();
    if (mode === "practice") startPractice();
    if (mode === "quiz") generateQuiz();
    if (mode === "listen") setListenIndex(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedNumber]);

  const handleCustomSubmit = () => {
    const n = parseInt(customNumber);
    if (n > 0 && n <= 50) {
      setSelectedNumber(n);
      setCustomNumber("");
    }
  };

  const resetScore = () => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(0);
  };

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const ModeButton = ({ active, onClick, icon: Icon, label, color }) => (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
        active
          ? `${color} text-white shadow-lg scale-105`
          : "bg-white text-slate-600 hover:bg-slate-50 border-2 border-slate-200"
      }`}
    >
      <Icon size={20} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(135deg, #FFF8E7 0%, #FFE8D6 50%, #FFD4E5 100%)",
      fontFamily: "'Quicksand', 'Comic Sans MS', system-ui, sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Quicksand:wght@500;600;700&display=swap');
        * { font-family: 'Quicksand', system-ui, sans-serif; }
        .display-font { font-family: 'Fredoka', system-ui, sans-serif; }
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255, 159, 28, 0.6); }
          100% { box-shadow: 0 0 0 14px rgba(255, 159, 28, 0); }
        }
        @keyframes karaoke-beat {
          0% { transform: scale(0.4) rotate(-8deg); opacity: 0; }
          40% { transform: scale(1.25) rotate(3deg); opacity: 1; }
          70% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes bouncing-ball {
          0% { transform: translate(-50%, -30px) scale(0.8); opacity: 0; }
          30% { transform: translate(-50%, -50px) scale(1.2); opacity: 1; }
          60% { transform: translate(-50%, -10px) scale(1); opacity: 1; }
          100% { transform: translate(-50%, 40px) scale(0.6); opacity: 0; }
        }
        @keyframes sing-cue {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .pop-anim { animation: pop 0.35s ease; }
        .bounce-in { animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .pulse-ring { animation: pulse-ring 0.6s ease-out; }
        .karaoke-beat { animation: karaoke-beat 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .bouncing-ball { animation: bouncing-ball 0.6s ease-out; }
        .sing-cue { animation: sing-cue 0.8s ease-in-out infinite; }
      `}</style>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="text-center mb-6">
          <h1 className="display-font text-4xl sm:text-5xl font-bold mb-1 flex items-center justify-center gap-2" style={{ color: "#E85D75" }}>
            <Music size={40} /> Skip Count Heroes
          </h1>
          <p className="text-slate-600 font-semibold text-sm sm:text-base">
            A different nursery rhyme for every number! 🎵
          </p>
        </div>

        <div className="bg-white rounded-3xl p-4 mb-5 shadow-md border-4 border-white flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-4 sm:gap-6 items-center">
            <div className="text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Score</div>
              <div className="display-font text-2xl font-bold" style={{ color: "#4A90E2" }}>
                {score.correct}/{score.total}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Accuracy</div>
              <div className="display-font text-2xl font-bold" style={{ color: "#7BC74D" }}>
                {accuracy}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Streak</div>
              <div className="display-font text-2xl font-bold flex items-center gap-1" style={{ color: "#FF9F1C" }}>
                🔥 {streak}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Best</div>
              <div className="display-font text-2xl font-bold" style={{ color: "#E85D75" }}>
                ⭐ {bestStreak}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`p-2 rounded-full transition-colors ${musicEnabled ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}
              title={musicEnabled ? "Mute sounds" : "Unmute sounds"}
            >
              <Volume2 size={18} />
            </button>
            <button
              onClick={resetScore}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
              title="Reset score"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          <ModeButton active={mode === "practice"} onClick={() => setMode("practice")} icon={Target} label="Practice" color="bg-[#4A90E2]" />
          <ModeButton active={mode === "quiz"} onClick={() => setMode("quiz")} icon={Zap} label="Quiz" color="bg-[#E85D75]" />
          <ModeButton active={mode === "listen"} onClick={() => setMode("listen")} icon={Music} label="Music" color="bg-[#7BC74D]" />
        </div>

        <div className="bg-white rounded-3xl p-5 mb-5 shadow-md border-4 border-white">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} style={{ color: "#FF9F1C" }} />
            <span className="display-font font-bold text-slate-700">Count by {selectedNumber}s</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {presetNumbers.map((n) => (
              <button key={n} onClick={() => setSelectedNumber(n)}
                className={`display-font w-11 h-11 rounded-2xl font-bold text-lg transition-all ${
                  selectedNumber === n ? "text-white shadow-md scale-110" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                style={selectedNumber === n ? { background: "#FF9F1C" } : {}}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-semibold text-slate-500">Or pick any:</span>
            <input type="number" min="1" max="50" value={customNumber}
              onChange={(e) => setCustomNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit()}
              placeholder="?"
              className="w-20 px-3 py-2 rounded-xl border-2 border-slate-200 text-center font-bold focus:outline-none focus:border-orange-400" />
            <button onClick={handleCustomSubmit} className="px-4 py-2 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-800 transition-colors">Go</button>
          </div>
        </div>

        {mode === "practice" && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border-4 border-white">
            <h2 className="display-font text-xl sm:text-2xl font-bold mb-1 text-slate-700">Fill in the missing numbers! ✏️</h2>
            <p className="text-slate-500 text-sm mb-5">Type the blanks. Each right answer plays a note going up! 🎵</p>
            <div className="grid grid-cols-5 gap-2 sm:gap-3 mb-6">
              {practiceSequence.map((num, idx) => {
                const isHidden = hiddenIndices.includes(idx);
                const result = practiceResults[idx];
                const showResult = practiceChecked && isHidden;
                if (!isHidden) {
                  return <div key={idx} className="aspect-square rounded-2xl flex items-center justify-center display-font text-2xl sm:text-3xl font-bold text-white shadow-sm" style={{ background: "#FFB84D" }}>{num}</div>;
                }
                return (
                  <div key={idx} className="relative">
                    <input type="number" value={practiceAnswers[idx] || ""}
                      onChange={(e) => setPracticeAnswers({ ...practiceAnswers, [idx]: e.target.value })}
                      disabled={practiceChecked}
                      className={`w-full aspect-square rounded-2xl text-center display-font text-2xl sm:text-3xl font-bold border-4 focus:outline-none transition-all ${
                        showResult ? result ? "border-green-400 bg-green-50 text-green-700" : "border-red-400 bg-red-50 text-red-700"
                          : "border-blue-300 bg-blue-50 text-blue-700 focus:border-blue-500"
                      }`} placeholder="?" />
                    {showResult && (
                      <div className="absolute -top-2 -right-2 bounce-in">
                        {result ? (
                          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white"><Check size={16} strokeWidth={3} /></div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white"><X size={16} strokeWidth={3} /></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 justify-center">
              {!practiceChecked ? (
                <button onClick={checkPractice} disabled={Object.keys(practiceAnswers).length === 0}
                  className="display-font px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform"
                  style={{ background: "#4A90E2" }}>Check Answers ✓</button>
              ) : (
                <button onClick={startPractice}
                  className="display-font px-8 py-3 rounded-2xl text-white font-bold text-lg shadow-md hover:scale-105 transition-transform"
                  style={{ background: "#7BC74D" }}>Next Round →</button>
              )}
            </div>
            {practiceChecked && (
              <div className="mt-5 text-center bounce-in">
                {Object.values(practiceResults).every((r) => r) ? (
                  <div className="display-font text-2xl font-bold" style={{ color: "#7BC74D" }}>🎉 Perfect! You got them all!</div>
                ) : (
                  <div className="display-font text-xl font-bold text-slate-600">Good try! Keep practicing! 💪</div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "quiz" && quizQuestion && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border-4 border-white">
            <h2 className="display-font text-xl sm:text-2xl font-bold mb-5 text-slate-700">Quick Quiz! ⚡ <span className="text-sm font-normal text-slate-400">(with drumrolls!)</span></h2>
            <div className="text-center mb-6 py-8 rounded-2xl" style={{ background: "linear-gradient(135deg, #FFE8D6, #FFD4E5)" }}>
              <div className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">What comes at position {quizQuestion.position}?</div>
              <div className="display-font text-4xl sm:text-5xl font-bold" style={{ color: "#E85D75" }}>{selectedNumber} × {quizQuestion.position} = ?</div>
              <div className="text-slate-500 text-sm mt-2 italic">
                (Counting by {selectedNumber}s, what's the {quizQuestion.position}{quizQuestion.position === 1 ? "st" : quizQuestion.position === 2 ? "nd" : quizQuestion.position === 3 ? "rd" : "th"} number?)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {quizChoices.map((choice) => {
                const isSelected = quizSelected === choice;
                const isCorrect = choice === quizQuestion.answer;
                const showResult = quizSelected !== null;
                let bgStyle = { background: "white" };
                let borderClass = "border-slate-200";
                let textClass = "text-slate-700";
                if (showResult) {
                  if (isCorrect) { bgStyle = { background: "#DCFCE7" }; borderClass = "border-green-400"; textClass = "text-green-700"; }
                  else if (isSelected) { bgStyle = { background: "#FEE2E2" }; borderClass = "border-red-400"; textClass = "text-red-700"; }
                }
                return (
                  <button key={choice} onClick={() => pickQuizAnswer(choice)} disabled={showResult} style={bgStyle}
                    className={`display-font py-5 sm:py-6 rounded-2xl text-3xl sm:text-4xl font-bold border-4 ${borderClass} ${textClass} transition-all hover:scale-105 disabled:cursor-default disabled:hover:scale-100 shadow-sm`}>
                    {choice}{showResult && isCorrect && " ✓"}{showResult && isSelected && !isCorrect && " ✗"}
                  </button>
                );
              })}
            </div>
            {quizFeedback && (
              <div className="mt-5 text-center bounce-in">
                {quizFeedback === "correct" ? (
                  <div className="display-font text-2xl font-bold" style={{ color: "#7BC74D" }}>🎉 Awesome! {streak >= 3 && `${streak} in a row! 🔥`}</div>
                ) : (
                  <div className="display-font text-xl font-bold text-slate-600">The answer is <span style={{ color: "#E85D75" }}>{quizQuestion.answer}</span>. Try the next one!</div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === "listen" && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border-4 border-white">
            <h2 className="display-font text-xl sm:text-2xl font-bold mb-1 text-slate-700">🎵 Music Mode</h2>
            <p className="text-slate-500 text-sm mb-3">Sing the BIG number when it bounces! Each counting number has its own song.</p>
            {melodyStyle === "melody" && (
              <div className="mb-5 text-center bg-gradient-to-r from-pink-50 to-amber-50 py-3 px-4 rounded-2xl border-2 border-pink-100">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">🎶 Now Playing</div>
                <div className="display-font text-lg font-bold" style={{ color: "#E85D75" }}>"{currentTune.name}"</div>
                <div className="text-xs text-slate-500 italic">for counting by {selectedNumber}s</div>
              </div>
            )}
            <div className="grid grid-cols-10 gap-1 sm:gap-2 mb-5">
              {generateSequence(selectedNumber, 10).map((num, idx) => {
                const isActive = idx === listenIndex;
                const isPast = isPlaying && idx < listenIndex;
                return (
                  <button key={idx} onClick={() => playSingleNote(num, idx)}
                    className={`aspect-square rounded-xl flex items-center justify-center display-font text-xs sm:text-base font-bold text-white shadow-sm transition-all ${isActive ? "scale-125 ring-2 ring-amber-400" : ""}`}
                    style={{
                      background: isActive ? "#FF9F1C" : isPast ? `hsl(${(idx * 30 + 190) % 360}, 45%, 72%)` : `hsl(${(idx * 30 + 190) % 360}, 65%, 58%)`,
                      opacity: isPast ? 0.5 : 1,
                    }}>{num}</button>
                );
              })}
            </div>

            <div className="relative rounded-3xl overflow-hidden mb-5 border-4 border-amber-200" style={{
              background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)", minHeight: "280px",
            }}>
              <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 20%, white 1px, transparent 1px), radial-gradient(circle at 40% 70%, white 1.5px, transparent 1.5px), radial-gradient(circle at 85% 60%, white 1px, transparent 1px), radial-gradient(circle at 15% 80%, white 1px, transparent 1px), radial-gradient(circle at 60% 45%, white 1.5px, transparent 1.5px)",
                backgroundSize: "100% 100%",
              }}></div>
              <div className="relative z-10 flex flex-col items-center justify-center py-6 sm:py-10 px-4">
                {!isPlaying && listenIndex === -1 ? (
                  <div className="text-center">
                    <div className="display-font text-4xl sm:text-5xl font-bold text-white/80 mb-2">🎤</div>
                    <div className="display-font text-xl sm:text-2xl font-bold text-white">Ready to sing?</div>
                    <div className="text-white/70 text-sm mt-2">Press Play and sing when the number bounces!</div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-6 sm:gap-10 w-full">
                      <div className="w-16 sm:w-24 text-center opacity-30">
                        {listenIndex > 0 && (<div className="display-font text-3xl sm:text-5xl font-bold text-white">{generateSequence(selectedNumber, 10)[listenIndex - 1]}</div>)}
                      </div>
                      <div key={`karaoke-${listenIndex}`} className="karaoke-beat relative">
                        <div className="display-font font-bold text-center" style={{
                          fontSize: "clamp(4rem, 18vw, 9rem)", color: "#FFD700",
                          textShadow: "0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3), 4px 4px 0 #FF6B9D",
                          lineHeight: "1",
                        }}>{listenIndex >= 0 ? generateSequence(selectedNumber, 10)[listenIndex] : ""}</div>
                        <div className="bouncing-ball absolute -top-4 left-1/2 -translate-x-1/2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg"></div>
                        </div>
                      </div>
                      <div className="w-16 sm:w-24 text-center opacity-50">
                        {listenIndex < 9 && listenIndex >= 0 && (<div className="display-font text-3xl sm:text-5xl font-bold text-white/70">{generateSequence(selectedNumber, 10)[listenIndex + 1]}</div>)}
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="sing-cue display-font text-lg sm:text-xl font-bold text-pink-300">🎤 Sing!</div>
                    </div>
                  </>
                )}
              </div>
              {isPlaying && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-pink-400 transition-all" style={{ width: `${((listenIndex + 1) / 10) * 100}%` }}></div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <button onClick={playMusicalSequence}
                  className="display-font px-10 py-4 rounded-2xl text-white font-bold text-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-3"
                  style={{ background: isPlaying ? "#E85D75" : "#7BC74D" }}>
                  <Play size={24} fill="white" />{isPlaying ? "Stop the Music" : "Play the Song!"}
                </button>
              </div>

              <div className="flex items-center gap-2 bg-amber-50 px-4 py-3 rounded-2xl border-2 border-amber-100">
                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">🎼 Tempo</span>
                <input type="range" min="60" max="160" step="5" value={tempo}
                  onChange={(e) => setTempo(parseInt(e.target.value))} className="flex-1" />
                <span className="text-sm font-bold text-slate-700 w-14 text-right">{tempo} bpm</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2 text-center">🎹 Instrument</div>
                  <div className="flex gap-1">
                    {[{ id: "marimba", label: "Marimba" }, { id: "bells", label: "Bells" }, { id: "synth", label: "Synth" }].map((inst) => (
                      <button key={inst.id} onClick={() => setInstrument(inst.id)}
                        className={`flex-1 px-2 py-2 rounded-xl font-bold text-sm transition-all ${
                          instrument === inst.id ? "bg-indigo-500 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}>{inst.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2 text-center">🎵 Style</div>
                  <div className="flex gap-1">
                    <button onClick={() => setMelodyStyle("melody")}
                      className={`flex-1 px-2 py-2 rounded-xl font-bold text-sm transition-all ${
                        melodyStyle === "melody" ? "bg-pink-500 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}>Nursery Tune</button>
                    <button onClick={() => setMelodyStyle("ascending")}
                      className={`flex-1 px-2 py-2 rounded-xl font-bold text-sm transition-all ${
                        melodyStyle === "ascending" ? "bg-pink-500 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}>Going Up</button>
                  </div>
                </div>
              </div>

              <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 cursor-pointer font-bold transition-colors ${drumsOn ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                <Drum size={18} />Drums
                <input type="checkbox" checked={drumsOn} onChange={(e) => setDrumsOn(e.target.checked)} className="ml-1 w-4 h-4" />
              </label>

            </div>

            <div className="mt-5 text-center text-slate-500 text-sm italic">🎤 Watch the bouncing ball — sing the big number when it lands!</div>
          </div>
        )}

        {!audioReady && (<div className="mt-4 text-center text-xs text-slate-500 italic">🔊 Tap anywhere to start the music</div>)}

        <div className="text-center mt-6 text-slate-400 text-sm font-semibold">Made with 🎵 for future math whizzes</div>
      </div>
    </div>
  );
}