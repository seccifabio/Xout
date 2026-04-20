"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import exercisesData from "../data/exercises.json";

const BODY_AREAS = ['All', 'Upper', 'Lower', 'Abs', 'Core', 'Full'];

interface Exercise {
  id: string;
  name: string;
  reps: string;
  highImpact: boolean;
  desc: string;
  requiresEquipment?: boolean;
  bodyArea?: string;
  duration?: number;
}



export default function Home() {
  const [session, setSession] = useState<Exercise[]>([]);
  const [totalTrainingTime, setTotalTrainingTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [noEquip, setNoEquip] = useState(true);
  const [selectionMode, setSelectionMode] = useState<'surprise' | 'manual'>('surprise');
  const [selectedTime, setSelectedTime] = useState(10);
  const [globalDuration, setGlobalDuration] = useState(30);
  const [breakTime, setBreakTime] = useState(10);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);
  const [isTimeSheetOpen, setIsTimeSheetOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [savedRituals, setSavedRituals] = useState<any[]>([]);
  const [bgIndex, setBgIndex] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);

  useEffect(() => {
    // Start exit after reveal + shine sequence (~2.5s)
    const timer = setTimeout(() => setIsSplashExiting(true), 2500);
    // Unmount after exit animation (~1s)
    const unmountTimer = setTimeout(() => setIsSplashActive(false), 3500);
    return () => {
      clearTimeout(timer);
      clearTimeout(unmountTimer);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const renameRitual = (idx: number) => {
    const currentName = savedRituals[idx].name || "";
    const newName = prompt("Enter a custom name for this workout ritual:", currentName);
    if (newName !== null) {
      const next = [...savedRituals];
      next[idx] = { ...next[idx], name: newName };
      localStorage.setItem('xout_saved_workouts', JSON.stringify(next));
      setSavedRituals(next);
      triggerToast("Ritual Renamed");
    }
  };

  const isLoaded = useRef(false);

  useEffect(() => {
    setHasHydrated(true);
    const storedRituals = localStorage.getItem('xout_saved_workouts');
    if (storedRituals) setSavedRituals(JSON.parse(storedRituals));

    // PREVIEW RITUAL: Jump straight to post-workout states
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === 'well-done') {
      setIsFinished(true);
    }
  }, []);

  const [isTraining, setIsTraining] = useState(false);
  const isTrainingRef = useRef(false); // Synchronous guard for speak() — React state is async
  const [isPreparing, setIsPreparing] = useState(false);

  // VIEWPORT STABILITY RITUAL: Prevent shifting on session start
  useEffect(() => {
    if (isTraining || isPreparing) {
      // Force scroll to top before locking
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.documentElement.style.overflow = '';
    };
  }, [isTraining, isPreparing]);

  // Sync favorites with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('xout_favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Ensure uniqueness on load
          setFavorites([...new Set(parsed)].slice(0, 10));
        }
      } catch (e) {
        console.error("Failed to load favorites", e);
      }
    }
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    if (isLoaded.current) {
      localStorage.setItem('xout_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const toggleFavorite = (name: string) => {
    setIsRitualActive(false);
    setFavorites(prev => {
      const isFav = prev.includes(name);
      if (isFav) {
        const next = prev.filter(f => f !== name);
        // Also remove from session if it was a favorite
        setSession(current => current.filter(ex => ex.name !== name));
        return next;
      }
      if (prev.length >= 10) return prev;
      const next = [...prev, name];
      
      // Auto-add to session if in manual mode and tray not full
      if (selectionMode === 'manual' && session.length < maxExercises) {
        const ex = [...exercisesData.warmups, ...exercisesData.exercises, ...exercisesData.cooldowns].find(e => e.name === name);
        if (ex && !session.some(r => r.name === name)) {
          setSession(current => [...current, { ...ex, duration: globalDuration }]);
        }
      }
      return next;
    });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    setIsRitualActive(false);
    setSession(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const maxExercises = useMemo(() => {
    return Math.max(3, selectedTime);
  }, [selectedTime]);

  const availableExercises = useMemo(() => {
    const all = [
      ...exercisesData.warmups,
      ...exercisesData.exercises,
      ...exercisesData.cooldowns
    ];
    
    // If searching, show all matching exercises regardless of filters
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return all.filter(ex => 
        ex.name.toLowerCase().includes(q) || 
        ex.desc.toLowerCase().includes(q)
      );
    }

    const basePool = selectedArea === 'Abs' ? exercisesData.exercises : all;
    
    return basePool.filter(ex => {
      if (noEquip && (ex as any).requiresEquipment) return false;
      if (selectedArea !== 'All') {
        const area = (ex.bodyArea || "").trim();
        const isAreaMatch = selectedArea === 'Abs' ? (area === 'Core' || area === 'Abs') : area === selectedArea;
        // If Abs is selected, only show main exercises (no warmups/cooldowns)
        if (selectedArea === 'Abs') return isAreaMatch && ex.id.startsWith('e');
        if (!isAreaMatch) return false;
      }
      return true;
    });
  }, [noEquip, selectedArea, searchQuery]);

  const [prepareTime, setPrepareTime] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isWarmup, setIsWarmup] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  const [weights, setWeights] = useState<{ date: string, value: number }[]>([]);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [showVerdictPreview, setShowVerdictPreview] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'verdict') setShowVerdictPreview(true);
    }
  }, []);

  
  // MET Values for calorie estimation (bodyweight focus)
  const MET_VALUES: Record<string, number> = {
    warmup: 3.5,
    cooldown: 3.0,
    explosive: 8.0,
    strength: 5.0,
    cardio: 7.5,
    default: 5.5
  };


  const wakeLockRef = useRef<any>(null);
  
  const beepAudioRef = useRef<any>(null);
  const ignitionAudioRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      beepAudioRef.current = new window.Audio("/beep.wav");
      ignitionAudioRef.current = new window.Audio("/ignition.wav");
    }
  }, []);

  // Sync weights with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('xout_weights');
    if (saved) {
      try {
        setWeights(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Synchronize weights back to localStorage on every change
  useEffect(() => {
    if (weights.length > 0) {
      localStorage.setItem('xout_weights', JSON.stringify(weights));
    }
  }, [weights]);

  // MANIFESTO STATE: Track manual picks separately from hearts
  const [manualSession, setManualSession] = useState<Exercise[]>([]);

  const [trainingSession, setTrainingSession] = useState<Exercise[]>([]);
  
  // AUTO-SYNC: Session Tray = Favorites + Manual Picks
  useEffect(() => {
    // Skip sync if we just loaded a ritual or surprise to prevent it from being overwritten by favorites
    if (selectionMode === 'manual' && isLoaded.current && !isRitualActive) {
      // If we are here, we definitely want to sync favorites to manual session
      const currentFavNames = (favorites || []).slice(0, 10);
      const favExs = currentFavNames.map(name => {
        const ex = [...exercisesData.warmups, ...exercisesData.exercises, ...exercisesData.cooldowns].find(e => e.name === name);
        return ex ? { ...ex, duration: globalDuration } : null;
      }).filter(Boolean) as Exercise[];

      // Combine: Favs take priority, followed by manual picks that aren't already favs
      const combined = [...favExs];
      manualSession.forEach(m => {
        if (!combined.some(c => c.name === m.name)) {
          combined.push(m);
        }
      });
      
      const limited = combined.slice(0, maxExercises);
      if (JSON.stringify(limited.map(e => e.name)) !== JSON.stringify(session.map(e => e.name))) {
        setSession(limited);
      }
    }
  }, [favorites, manualSession, selectionMode, globalDuration, maxExercises, isRitualActive, session]);

  const removeFromSession = (id: string) => {
    const ex = session.find(e => e.id === id);
    if (!ex) return;
    setIsRitualActive(false);
    setManualSession(prev => prev.filter(m => m.id !== id && m.name !== ex.name));
    if (favorites.includes(ex.name)) {
      toggleFavorite(ex.name);
    }
  };

  const addToSession = (ex: Exercise) => {
    // Check if it's already in manual picks
    const isAlreadyManual = manualSession.some(m => m.name === ex.name);
    
    setIsRitualActive(false);
    if (isAlreadyManual) {
      // Toggle off manual pick
      setManualSession(prev => prev.filter(m => m.name !== ex.name));
    } else {
      // Toggle on manual pick
      if (manualSession.length + favorites.length >= maxExercises) return;
      setManualSession(prev => [...prev, { ...ex, duration: globalDuration }]);
    }
  };

  const clearSession = () => {
    setIsRitualActive(false);
    setManualSession([]);
    setSession([]);
  };

  // SAFARI RITUAL SYNC: Map interface state to OS theme
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const color = (isPreparing && prepareTime <= 3) ? "#ff6b00" : (isTraining ? "black" : "#daff00");
    if (meta) meta.setAttribute("content", color);
  }, [isPreparing, prepareTime, isTraining]);

  // WAKE LOCK LOGIC: Ensure screen stays active during training
  useEffect(() => {
    const requestWakeLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.error(`Wake Lock failed: ${err}`);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isTraining && !isPaused) {
        requestWakeLock();
      }
    };

    if (isTraining && !isPaused) {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => { wakeLockRef.current = null; }).catch(() => {});
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTraining, isPaused]);

  const generateSession = () => {
    const totalCycle = (globalDuration || 45) + (breakTime || 0);
    const allPool = [
      ...exercisesData.warmups,
      ...exercisesData.exercises,
      ...exercisesData.cooldowns
    ].filter(e => noEquip ? !e.requiresEquipment : true);

    const exerciseCount = Math.min(maxExercises, Math.max(3, Math.floor((selectedTime * 60) / totalCycle)));
    
    // 1. Start fresh for true balance flow
    let finalSession: Exercise[] = [];

    // 2. Balanced Filler Strategy
    if (selectedArea === 'All') {
      const categories = ['Upper', 'Lower', 'Midsection', 'Full'];
      let catIndex = Math.floor(Math.random() * categories.length);
      
      const sessionGoal = exerciseCount;
      
      while (finalSession.length < sessionGoal) {
        const targetCat = categories[catIndex % categories.length];
        
        // Find pool for this category with robust case-insensitive matching
        const catPool = allPool.filter(ex => {
          const area = (ex.bodyArea || "").trim();
          if (targetCat === 'Midsection') return (area === 'Core' || area === 'Abs');
          return area === targetCat;
        }).filter(ex => !finalSession.some(f => f.name === ex.name));

        if (catPool.length > 0) {
          // Check if we have favorites in this specific category bucket
          const catFavs = catPool.filter(ex => favorites.includes(ex.name));
          
          // Prioritize picking a favorite if one exists for this category bucket
          const randomEx = catFavs.length > 0
            ? catFavs[Math.floor(Math.random() * catFavs.length)]
            : catPool[Math.floor(Math.random() * catPool.length)];
            
          finalSession.push({ ...randomEx, duration: globalDuration });
        }
        
        catIndex++;
        if (catIndex > 500) break; 
      }
    } else {
      // Specific Area selected: only from that area and respect noEquip
      const areaPool = allPool.filter(ex => {
        const area = (ex.bodyArea || "").trim();
        const isAreaMatch = selectedArea === 'Abs' ? (area === 'Core' || area === 'Abs') : area === selectedArea;
        // If Abs, only main exercises (id starts with 'e')
        if (selectedArea === 'Abs') return isAreaMatch && ex.id.startsWith('e');
        return isAreaMatch;
      });
      const fillers = areaPool
        .filter(ex => !finalSession.some(f => f.name === ex.name))
        .sort(() => Math.random() - 0.5)
        .slice(0, exerciseCount - finalSession.length);
      finalSession = [...finalSession, ...fillers.map(ex => ({ ...ex, duration: globalDuration }))];
    }

    const randomized = finalSession.sort(() => Math.random() - 0.5);
    setSession(randomized);
    // Preserve exactly what was randomized for first manual switch
    setManualSession(randomized);
    setIsRitualActive(true);
    isTrainingRef.current = false;
    setIsTraining(false);
    setIsPreparing(false);
    setTrainingSession([]);
    setCurrentIndex(0);
    setElapsedTime(0);
    setTimeLeft(30);
  };

  const saveWorkout = () => {
    if (session.length === 0) return;
    const timestamp = new Date().toISOString();
    const workoutToSave = {
      id: timestamp,
      date: new Date().toLocaleDateString(),
      duration: selectedTime,
      exercises: [...session] // clone for stability
    };
    
    // Persist to Storage first
    const existing = JSON.parse(localStorage.getItem('xout_saved_workouts') || '[]');
    const newArchived = [workoutToSave, ...existing];
    localStorage.setItem('xout_saved_workouts', JSON.stringify(newArchived));
    
    // Update State functional update
    setSavedRituals(prev => [workoutToSave, ...prev]);
    setIsSaved(true);
    triggerToast("Workout Saved to Library");
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isCurrentSessionSaved = useMemo(() => {
    if (!hasHydrated || session.length === 0) return false;
    const currentIds = session.map(s => s.id).sort().join(',');
    return savedRituals.some((w: any) => 
      w.exercises && w.exercises.map((e: any) => e.id).sort().join(',') === currentIds
    );
  }, [session, hasHydrated, savedRituals]);

  const caloriesBurned = useMemo(() => {
    if (!hasHydrated || session.length === 0) return 0;
    const weight = weights.length > 0 ? weights[weights.length - 1].value : 75;
    
    // Estimate based on session structure
    return session.reduce((acc, ex) => {
      let met = MET_VALUES.default;
      if (ex.id.startsWith('w')) met = MET_VALUES.warmup;
      if (ex.id.startsWith('c')) met = MET_VALUES.cooldown;
      if (ex.highImpact) met = MET_VALUES.explosive;
      
      // Formula: (MET * 3.5 * weight / 200) * duration_minutes
      const durationMin = (ex.duration || 60) / 60;
      return acc + ((met * 3.5 * weight) / 200) * durationMin;
    }, 0);
  }, [session, weights, hasHydrated]);

  const totalSessionDuration = useMemo(() => {
    return session.reduce((acc, ex) => acc + (ex.duration || 60), 0);
  }, [session]);


  const swapExercise = (index: number) => {
    const filterFunc = (e: any) => {
      const passesEquip = noEquip ? !e.requiresEquipment : true;
      const notInSession = !session.some(r => r.id === e.id);
      return passesEquip && notInSession;
    };

    const ex = session[index];
    let pool: Exercise[] = [];
    if (ex.id.startsWith('w')) pool = exercisesData.warmups;
    else if (ex.id.startsWith('c')) pool = exercisesData.cooldowns;
    else pool = exercisesData.exercises;

    const filteredPool = pool.filter(filterFunc);
    if (filteredPool.length === 0) return;

    const replacement = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    const newSession = [...session];
    newSession[index] = { ...replacement, duration: globalDuration };
    
    setIsRitualActive(false);
    setManualSession(newSession.filter(ex => !favorites.includes(ex.name)));
    setSession(newSession);
  };

  const startWarmup = () => {
    setIsTraining(false);
    setIsWarmup(true);
    setIsCooldown(false);
    isTrainingRef.current = true;
    
    // Select 3 random warmups
    const pool = [...exercisesData.warmups].sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, 3).map(ex => ({ ...ex, duration: 30 })); 
    
    setTrainingSession(selected);
    setTotalRounds(1);
    setTotalTrainingTime(selected.length * 30 + (selected.length - 1) * 10);
    setIsTraining(true);
    setIsPreparing(true);
    setPrepareTime(5);
    setIsPaused(false);
    setCurrentIndex(0);
    setElapsedTime(0);
    setTimeLeft(30);
    
    speak("Starting warm up ritual. Let's get the body moving.");
  };

  const startSession = () => {
    if (session.length === 0) return;
    startWarmup();
  };

  const startMainWorkout = () => {
    if (session.length === 0) return;
    setIsWarmup(false);
    setIsCooldown(false);
    
    // AUTO-ROUND: Expand session to fill the total time budget in full rounds
    const targetSeconds = selectedTime * 60;
    const singlePassDuration = session.reduce((acc, ex) => acc + (ex.duration || globalDuration) + breakTime, 0);
    const roundsNeeded = Math.max(1, Math.ceil(targetSeconds / singlePassDuration));

    let expandedSession: Exercise[] = [];
    for (let r = 0; r < roundsNeeded; r++) {
      session.forEach(ex => {
        expandedSession.push({ ...ex });
      });
    }

    isTrainingRef.current = true;
    setTrainingSession(expandedSession);
    setTotalRounds(roundsNeeded);
    
    // Recalculate total training time based on the actual items + breaks
    const totalTime = expandedSession.reduce((acc, item) => acc + (item.duration || globalDuration) + breakTime, 0);
    setTotalTrainingTime(totalTime);
    
    setIsTraining(true);
    setIsPreparing(true);
    setPrepareTime(10);
    setIsPaused(false);
    setCurrentIndex(0);
    setElapsedTime(0);
    setTimeLeft(expandedSession[0].duration || globalDuration);
    playIgnitionBeep();

    // Unlock native HTML5 audio for iOS background processing
    if (beepAudioRef.current) {
      beepAudioRef.current.play().then(() => {
        beepAudioRef.current.pause();
        beepAudioRef.current.currentTime = 0;
      }).catch(() => {});
    }

    // iOS Safari Hack: Fire a silent utterance immediately to tether the Speech queue to the user interaction
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const silentUtterance = new SpeechSynthesisUtterance("");
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }
    
    speak(`Warm up complete. First exercise: ${expandedSession[0].name}. ${expandedSession[0].desc}`);
  };

  const startCooldown = () => {
    setIsFinished(false);
    setIsCooldown(true);
    isTrainingRef.current = true;
    
    // Select 3 unique cooldown exercises
    const pool = [...exercisesData.cooldowns].sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, 3).map(ex => ({ ...ex, duration: 60 })); 
    
    setTrainingSession(selected);
    setTotalRounds(1);
    setTotalTrainingTime(selected.length * 60 + (selected.length - 1) * breakTime);
    setIsTraining(true);
    setIsPreparing(true);
    setPrepareTime(5); 
    setIsPaused(false);
    setCurrentIndex(0);
    setElapsedTime(0);
    setTimeLeft(60);
    
    speak("Starting cooldown. Slow down your heart rate and breathe.");
  };

  const stopSession = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsTraining(false);
    setIsCooldown(false);
    setIsPreparing(false);
    isTrainingRef.current = false;
    
    setTrainingSession([]);
    setCurrentIndex(0);
    setPrepareTime(10);
    setElapsedTime(0);
    setTimeLeft(session[0]?.duration || 60);
    setIsPaused(false);
  };

  const speak = (text: string) => {
    if (!isTrainingRef.current || isVoiceMuted) return; // Don't speak if session is stopped or muted
    if (typeof window !== "undefined" && window.speechSynthesis) {
      console.log("XOUT AUDIO DEPLOY: ", text);
      
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      
      // Only cancel if actively speaking to avoid Chrome queue destruction
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      (window as any)._xoutUtterance = utterance; 
      
      // Force local OS voice to bypass network blocks
      const voices = window.speechSynthesis.getVoices();
      const localVoice = voices.find(v => v.localService && v.lang.startsWith('en')) || voices[0];
      if (localVoice) {
        utterance.voice = localVoice;
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      // Synchronous execution REQUIRED for iOS Safari interaction-lock
      window.speechSynthesis.speak(utterance);
    }
  };

  const playBeep = () => {
    if (!isTrainingRef.current) return;
    if (beepAudioRef.current) {
      beepAudioRef.current.currentTime = 0;
      beepAudioRef.current.play().catch(() => {});
    }
  };

  const playIgnitionBeep = () => {
    if (!isTrainingRef.current) return;
    if (ignitionAudioRef.current) {
      ignitionAudioRef.current.currentTime = 0;
      ignitionAudioRef.current.play().catch(() => {});
    }
  };

  // 1. Chronometric Mathematical Engine
  useEffect(() => {
    let interval: any;
    if (isTraining && !isPaused) {
      if (isPreparing) {
        if (prepareTime > 0) {
          interval = setInterval(() => {
            setPrepareTime(p => p - 1);
            setElapsedTime(e => e + 1);
          }, 1000);
        } else {
          setIsPreparing(false);
        }
      } else if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft(p => p - 1);
          setElapsedTime(e => e + 1);
        }, 1000);
      } else if (timeLeft === 0) {
        if (currentIndex < trainingSession.length - 1) {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          if (breakTime > 0) {
            setIsPreparing(true);
            setPrepareTime(breakTime);
            setTimeLeft(trainingSession[nextIdx].duration || 60);
          } else {
            setIsPreparing(false);
            setTimeLeft(trainingSession[nextIdx].duration || 60);
          }
        } else {
          if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
          isTrainingRef.current = false;
          setIsTraining(false);
          if (isWarmup) {
            setIsWarmup(false);
            speak("Warm up complete. Transitioning to main workout.");
            startMainWorkout();
          } else if (isCooldown) {
            setIsCooldown(false);
            speak("Cooldown complete. You are ready to go.");
          } else {
            setIsFinished(true);
            playSuccessSound();
            speak("Session complete. Outstanding work.");
          }
        }
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTraining, isPreparing, prepareTime, timeLeft, currentIndex, trainingSession, isPaused, breakTime]);

  const playSuccessSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const audio = new Audio('/freesound_community-yeah-96783.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } catch (e) { console.error(e); }
  };

  // 2. Reactive Auditory Engine
  useEffect(() => {
    if (!isTraining || isPaused) return;

    if (isPreparing) {
      // 3-2-1 Bips during preparation
      if (prepareTime <= 3 && prepareTime >= 1) playBeep();
      if (prepareTime === 0) playIgnitionBeep();
      
      // Voice cues transitioning into break
      if (currentIndex > 0) {
        if (breakTime <= 10 && prepareTime === breakTime) {
          speak(`Break. Next exercise: ${trainingSession[currentIndex]?.name}. ${trainingSession[currentIndex]?.desc}`);
        } else if (breakTime > 10 && prepareTime === breakTime) {
          speak(`Break.`);
        } else if (breakTime > 10 && prepareTime === 10) {
          speak(`Next exercise: ${trainingSession[currentIndex]?.name}. ${trainingSession[currentIndex]?.desc}`);
        }
      }
    } else {
      // 3-2-1 Bips during active exercise
      if (timeLeft <= 3 && timeLeft >= 1) playBeep();
      
      // Zero-recovery next exercise voice cue at exactly 10s left
      if (breakTime === 0 && timeLeft === 10 && currentIndex < trainingSession.length - 1) {
        speak(`Next exercise: ${trainingSession[currentIndex + 1]?.name}. ${trainingSession[currentIndex + 1]?.desc}`);
      }
      
      // Ignition beep for zero-recovery transitions
      if (breakTime === 0 && currentIndex > 0 && timeLeft === (trainingSession[currentIndex]?.duration || 60)) {
        playIgnitionBeep();
      }
    }
  }, [prepareTime, timeLeft, isPreparing, isTraining, isPaused, breakTime, currentIndex, trainingSession]);

  const currentAccent = (isPreparing && prepareTime <= 3) ? "black" : "#daff00";

  const currentBackground = () => {
    if (isPreparing && prepareTime <= 3) {
      return isWarmup ? "#ff6b00" : "var(--accent)";
    }
    
    if (isPaused) return "#333";
    
    // Flash background colors based on mode
    if (isWarmup) return "#ff6b00";
    if (isCooldown) return "#007bff";
    
    return "black";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const skipCurrent = () => {
    setTimeLeft(0);
    setPrepareTime(0);
  };

  return (
    <main style={{ 
      minHeight: "100vh", 
      background: "black", 
      color: "white", 
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflowX: "hidden",
      paddingTop: "env(safe-area-inset-top)"
    }}>
      
      {/* Cinematic Splash Portal */}
      {isSplashActive && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "black",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: isSplashExiting ? 0 : 1,
          pointerEvents: isSplashExiting ? "none" : "all"
        }}>
          {/* Background Split Ritual */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            transition: "transform 1.2s cubic-bezier(0.7, 0, 0.3, 1)",
            transform: isSplashExiting ? "scale(1.1)" : "scale(1)"
          }}>
            <div style={{ 
              flex: 1, 
              background: "#050505", 
              transition: "transform 1s cubic-bezier(0.7, 0, 0.3, 1)",
              transform: isSplashExiting ? "translateX(-100%)" : "translateX(0)"
            }} />
            <div style={{ 
              flex: 1, 
              background: "#080808",
              transition: "transform 1s cubic-bezier(0.7, 0, 0.3, 1)",
              transform: isSplashExiting ? "translateX(100%)" : "translateX(0)"
            }} />
          </div>

          <div style={{ 
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem"
          }}>
            {/* Logo Aperture */}
            <div style={{
              width: "120px",
              height: "120px",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div className="aperture-ring" style={{
                position: "absolute",
                inset: 0,
                border: "2px solid var(--accent)",
                borderRadius: "50%",
                opacity: 0.2,
                transform: isSplashExiting ? "scale(2)" : "scale(1)",
                transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }} />
              
              <svg 
                viewBox="0 0 100 100" 
                style={{ 
                  width: "60px", 
                  fill: "var(--accent)",
                  filter: "drop-shadow(0 0 20px rgba(218, 255, 0, 0.4))",
                  opacity: isSplashExiting ? 0 : 1,
                  transform: isSplashExiting ? "scale(0.8)" : "scale(1)",
                  transition: "all 0.8s' },files:[{content: