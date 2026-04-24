"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import exercisesData from "../data/exercises.json";

const BODY_AREAS = ['Upper', 'Lower', 'Abs', 'Core', 'Full'];

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
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [isSurfMode, setIsSurfMode] = useState(false);
  const [isYogaMode, setIsYogaMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [savedRituals, setSavedRituals] = useState<any[]>([]);
  const [bgIndex, setBgIndex] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch' | 'tabata'>('stopwatch');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerPresets, setTimerPresets] = useState([30, 60, 120, 180, 300]);
  const [isTimerPreparing, setIsTimerPreparing] = useState(false);
  const [timerPrepareTime, setTimerPrepareTime] = useState(10);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(60);

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
      triggerToast("Workout Renamed");
    }
  };

  const isLoaded = useRef(false);

  useEffect(() => {
    setHasHydrated(true);
    const storedRituals = localStorage.getItem('xout_saved_workouts');
    if (storedRituals) {
      try {
        setSavedRituals(JSON.parse(storedRituals));
      } catch (e) {
        console.error("Error parsing saved rituals:", e);
        setSavedRituals([]);
      }
    }

    // PREVIEW RITUAL: Jump straight to post-workout states
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === 'well-done') {
      // Inject some mock session data for high-fidelity preview
      setSession([
        { id: 'e1', name: 'Explosive Sprints', reps: '30s', highImpact: true, desc: 'HIIT' },
        { id: 'e2', name: 'Pushups', reps: '20', highImpact: false, desc: 'Strength' },
        { id: 'e3', name: 'Burpees', reps: '15', highImpact: true, desc: 'HIIT' }
      ]);
      setTotalRounds(4);
      setIsFinished(true);
    }
  }, []);

  const [isTraining, setIsTraining] = useState(false);
  const isTrainingRef = useRef(false); // Synchronous guard for speak() — React state is async
  const [isPreparing, setIsPreparing] = useState(false);
  const beepAudioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const ignitionAudioRef = useRef<HTMLAudioElement | null>(null);

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
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= session.length) return;

    setSession(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

    // To persist reorder through the sync effect, we must update the source arrays
    const item1 = session[index];
    const item2 = session[target];
    const isFav1 = favorites.includes(item1.name);
    const isFav2 = favorites.includes(item2.name);

    if (isFav1 && isFav2) {
      setFavorites(prev => {
        const next = [...prev];
        const idx1 = next.indexOf(item1.name);
        const idx2 = next.indexOf(item2.name);
        if (idx1 !== -1 && idx2 !== -1) {
          [next[idx1], next[idx2]] = [next[idx2], next[idx1]];
        }
        return next;
      });
    } else {
      // Update manualSession order or mixed order for the next sync
      setManualSession(prev => {
        // Construct the expected manual order from the intended session state
        const nextSession = [...session];
        [nextSession[index], nextSession[target]] = [nextSession[target], nextSession[index]];
        return nextSession.filter(ex => !favorites.includes(ex.name));
      });
    }
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

    const basePool = selectedAreas.includes('Abs') ? exercisesData.exercises : all;
    
      const filtered = basePool.filter(ex => {
        if (noEquip && (ex as any).requiresEquipment) return false;
        if (isSurfMode && !(ex as any).surf) return false;
        if (isYogaMode && !(ex as any).yoga) return false;
        if ((isSurfMode || isYogaMode) && favorites.includes(ex.name)) return false;

        if (selectedAreas.length > 0) {
          const area = (ex.bodyArea || "").trim();
          const isAreaMatch = selectedAreas.some(sel => {
            if (sel === 'Abs') return (area === 'Core' || area === 'Abs');
            return area === sel;
          });

          if (selectedAreas.length === 1 && selectedAreas[0] === 'Abs') {
            if (!ex.id.startsWith('e')) return false;
          }

          if (!isAreaMatch) return false;
        }
        return true;
      });

      // Sort favorites to the top in normal mode
      if (!isSurfMode && !isYogaMode) {
        return [...filtered].sort((a, b) => {
          const aFav = favorites.includes(a.name) ? 1 : 0;
          const bFav = favorites.includes(b.name) ? 1 : 0;
          return bFav - aFav;
        });
      }

      return filtered;
    }, [noEquip, selectedAreas, searchQuery, isSurfMode, isYogaMode, favorites]);

  const [prepareTime, setPrepareTime] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [currentTabataRound, setCurrentTabataRound] = useState(1);
  const [tabataPhase, setTabataPhase] = useState<'work' | 'rest'>('work');

  // Tabata Telemetry Calculations
  const tabataTotalDuration = (tabataRounds * 20) + ((tabataRounds - 1) * 10);
  
  const tabataElapsedSeconds = useMemo(() => {
    if (timerMode !== 'tabata') return 0;
    let elapsed = 0;
    // Finished rounds
    elapsed += (currentTabataRound - 1) * 30;
    // Current round
    if (tabataPhase === 'work') {
      elapsed += (20 - timerSeconds);
    } else {
      elapsed += 20 + (10 - timerSeconds);
    }
    return Math.max(0, elapsed);
  }, [timerMode, currentTabataRound, tabataPhase, timerSeconds]);

  const caloriesBurnedLive = useMemo(() => {
    // 0.175 kcal/sec for high intensity HIIT/Tabata
    return tabataElapsedSeconds * 0.175;
  }, [tabataElapsedSeconds]);
  const [isFinished, setIsFinished] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [hasCompletedCooldown, setHasCompletedCooldown] = useState(false);
  const [isWarmup, setIsWarmup] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  const [weights, setWeights] = useState<{ date: string, value: number }[]>([]);
  const [isWeightOpen, setIsWeightOpen] = useState(false);
  const [finalTabataStats, setFinalTabataStats] = useState<{ calories: number, duration: number } | null>(null);

  const wakeLockRef = useRef<any>(null);
  

  const speak = (text: string) => {
    if (isVoiceMuted) return;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      
      // Cancel any ongoing speech to avoid overlapping
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Safari/iOS Compatibility: Force local OS voice
      const voices = window.speechSynthesis.getVoices();
      const localVoice = voices.find(v => v.localService && v.lang.startsWith('en')) || voices[0];
      if (localVoice) {
        utterance.voice = localVoice;
      }

      utterance.rate = 1.1; // High energy
      utterance.pitch = 0.9; // Brutalist tone
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      beepAudioRef.current = new window.Audio("/beep.wav");
      bellAudioRef.current = new window.Audio("/ignition.wav"); // Fallback as bell.wav is missing
      ignitionAudioRef.current = new window.Audio("/ignition.wav");
    }
  }, []);  useEffect(() => {
    let interval: any;
    // TIMER / STOPWATCH / TABATA MAIN LOOP
    if (isTimerRunning && !isPaused) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (timerMode === 'stopwatch') {
            return prev + 1;
          } else {
            // Countdown / Tabata Logic
            if (prev <= 1) {
              if (timerMode === 'tabata') {
                // Tabata Phase Transition Ritual
                if (tabataPhase === 'work') {
                  if (currentTabataRound < tabataRounds) {
                    setTabataPhase('rest');
                    setInitialTimerSeconds(10);
                    if (bellAudioRef.current) { bellAudioRef.current.currentTime = 0; bellAudioRef.current.play(); }
                    speak("REST");
                    return 10; // Rest period
                  } else {
                    // Final Work period finished -> Success Ritual
                    setIsTimerRunning(false);
                    setIsTimerModalOpen(false);
                    setFinalTabataStats({
                      calories: caloriesBurnedLive,
                      duration: tabataTotalDuration
                    });
                    setIsFinished(true);
                    
                    const successAudio = new Audio('/freesound_community-yeah-96783.mp3');
                    successAudio.play().catch(e => console.log("Success audio blocked", e));
                    speak("WORKOUT COMPLETE");
                    return 0;
                  }
                } else {
                  // Rest period finished -> Increment round and start Work
                  setTabataPhase('work');
                  setInitialTimerSeconds(20);
                  setCurrentTabataRound(r => r + 1);
                  if (bellAudioRef.current) { bellAudioRef.current.currentTime = 0; bellAudioRef.current.play(); }
                  speak("WORK");
                  return 20; // Work period
                }
              } else {
                setIsTimerRunning(false);
                if (ignitionAudioRef.current) { ignitionAudioRef.current.currentTime = 0; ignitionAudioRef.current.play(); }
                speak("COMPLETE");
                return 0;
              }
            }
            // Warning Beeps (Last 3s: Beep at 3, 2, 1)
            // prev is the value before decrementing. 
            // If prev is 4, it beeps and next is 3. UI shows 3. (Beep for 3)
            // If prev is 3, it beeps and next is 2. UI shows 2. (Beep for 2)
            // If prev is 2, it beeps and next is 1. UI shows 1. (Beep for 1)
            if (prev <= 4 && prev > 1) {
              if (beepAudioRef.current) { beepAudioRef.current.currentTime = 0; beepAudioRef.current.play(); }
            }
            return prev - 1;
          }
        });
      }, 1000);
    } else if (isTimerPreparing && !isPaused) {
      // THE "GET READY" RITUAL LOOP
      interval = setInterval(() => {
        setTimerPrepareTime(prev => {
          if (prev === 10) speak("GET READY"); // Speak at the very start

          if (prev <= 1) {
            setIsTimerPreparing(false);
            setIsTimerRunning(true);
            if (ignitionAudioRef.current) {
              ignitionAudioRef.current.currentTime = 0;
              ignitionAudioRef.current.play().catch((e: any) => console.log("Ignition blocked", e));
            }
            if (timerMode === 'tabata') speak("WORK");
            return 0;
          }
          // Beep at 3, 2, 1
          if (prev <= 4 && prev > 1) {
            if (beepAudioRef.current) {
              beepAudioRef.current.currentTime = 0;
              beepAudioRef.current.play().catch((e: any) => console.log("Beep blocked", e));
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isTimerRunning, isTimerPreparing, isPaused, timerMode, tabataPhase, currentTabataRound, tabataRounds]);
;

  // Sync weights with localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('xout_weights');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWeights(parsed);
        }
      } catch (e) {
        console.error("Error parsing weights:", e);
        setWeights([]);
      }
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
  
  // AUTO-SYNC: Session Tray = Favorites + Manual Picks (Order Preserving)
  useEffect(() => {
    if (selectionMode === 'manual' && isLoaded.current && !isRitualActive) {
      const currentFavNames = (favorites || []).slice(0, 10);
      const favExs = currentFavNames.map(name => {
        const ex = [...exercisesData.warmups, ...exercisesData.exercises, ...exercisesData.cooldowns].find(e => e.name === name);
        return ex ? { ...ex, duration: globalDuration } : null;
      }).filter(Boolean) as Exercise[];

      // All items that should be in the tray
      const goals = [...favExs];
      manualSession.forEach(m => {
        if (!goals.some(c => c.name === m.name)) {
          goals.push(m);
        }
      });
      
      const goalNames = goals.map(g => g.name);
      
      // We want to keep existing session order, but add/remove to match goals
      let nextSession = [...session];
      
      // 1. Remove items that are no longer favorites OR manual picks
      nextSession = nextSession.filter(s => goalNames.includes(s.name));
      
      // 2. Add missing items (append to end)
      goals.forEach(g => {
        if (!nextSession.some(s => s.name === g.name)) {
          nextSession.push(g);
        }
      });
      
      const limited = nextSession.slice(0, maxExercises);
      
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

    if ((isTraining || isTimerRunning) && !isPaused) {
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
  }, [isTraining, isTimerRunning, isPaused]);

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
    if (selectedAreas.length === 0) {
      const categories = ['Upper', 'Lower', 'Midsection', 'Full'];
      let catIndex = Math.floor(Math.random() * categories.length);
      
      const sessionGoal = exerciseCount;
      
      while (finalSession.length < sessionGoal) {
        const targetCat = categories[catIndex % categories.length];
        
        // Find pool for this category
        const catPool = allPool.filter(ex => {
          if (isSurfMode && !(ex as any).surf) return false;
          if (isYogaMode && !(ex as any).yoga) return false;
          if ((isSurfMode || isYogaMode) && favorites.includes(ex.name)) return false;
          const area = (ex.bodyArea || "").trim();
          if (targetCat === 'Midsection') return (area === 'Core' || area === 'Abs');
          return area === targetCat;
        }).filter(ex => !finalSession.some(f => f.name === ex.name));

        if (catPool.length > 0) {
          const useFavs = !isSurfMode && !isYogaMode;
          const catFavs = useFavs ? catPool.filter(ex => favorites.includes(ex.name)) : [];
          const randomEx = catFavs.length > 0
            ? catFavs[Math.floor(Math.random() * catFavs.length)]
            : catPool[Math.floor(Math.random() * catPool.length)];
            
          finalSession.push({ ...randomEx, duration: globalDuration });
        }
        
        catIndex++;
        if (catIndex > 500) break; 
      }
    } else {
      // Specific Areas selected
      const areaPool = allPool.filter(ex => {
        if (isSurfMode && !(ex as any).surf) return false;
        if (isYogaMode && !(ex as any).yoga) return false;
        if ((isSurfMode || isYogaMode) && favorites.includes(ex.name)) return false;
        const area = (ex.bodyArea || "").trim();
        const isAreaMatch = selectedAreas.some(sel => {
          if (sel === 'Abs') return (area === 'Core' || area === 'Abs');
          return area === sel;
        });
        
        if (selectedAreas.length === 1 && selectedAreas[0] === 'Abs') {
          return isAreaMatch && ex.id.startsWith('e');
        }
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
    let existing = [];
    try {
      const stored = localStorage.getItem('xout_saved_workouts');
      existing = JSON.parse(stored || '[]');
    } catch (e) {
      console.error("Error parsing saved workouts for archive:", e);
      existing = [];
    }
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

  // MET Values for calorie estimation (bodyweight focus)
  const MET_VALUES: Record<string, number> = {
    warmup: 3.5,
    cooldown: 3.0,
    explosive: 8.0,
    strength: 5.0,
    cardio: 7.5,
    default: 5.5
  };

  const caloriesBurned = useMemo(() => {
    if (!hasHydrated || session.length === 0) return 0;
    const weight = weights.length > 0 ? weights[weights.length - 1].value : 75;
    
    // Estimate based on session structure
    const baseCalories = session.reduce((acc, ex) => {
      let met = MET_VALUES.default;
      if (ex.id.startsWith('w')) met = MET_VALUES.warmup;
      if (ex.id.startsWith('c')) met = MET_VALUES.cooldown;
      if (ex.highImpact) met = MET_VALUES.explosive;
      
      // Formula: (MET * 3.5 * weight / 200) * duration_minutes
      const durationMin = (ex.duration || 60) / 60;
      return acc + ((met * 3.5 * weight) / 200) * durationMin;
    }, 0);

    // Account for multiple rounds in the main ritual
    return baseCalories * totalRounds;
  }, [session, weights, hasHydrated, totalRounds]);

  const totalSessionDuration = useMemo(() => {
    return session.reduce((acc, ex) => acc + (ex.duration || globalDuration) + breakTime, 0);
  }, [session, globalDuration, breakTime]);

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
    setHasCompletedCooldown(false);
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

  const skipToNext = () => {
    if (!isTraining) return;
    if (isWarmup) {
      startMainWorkout();
      return;
    }
    
    const nextIdx = currentIndex + 1;
    if (nextIdx < trainingSession.length) {
      setCurrentIndex(nextIdx);
      setIsPreparing(true);
      setPrepareTime(breakTime > 0 ? breakTime : 1);
      setTimeLeft(trainingSession[nextIdx].duration || globalDuration);
    } else {
      setIsFinished(true);
      playSuccessSound();
      speak("Session complete.");
    }
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
    setFinalTabataStats(null); // Clear Tabata results when closing
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

  const primeAudio = () => {
    if (beepAudioRef.current) {
      beepAudioRef.current.play().then(() => {
        beepAudioRef.current.pause();
        beepAudioRef.current.currentTime = 0;
      }).catch((e: any) => console.log("Audio priming blocked", e));
    }
    if (ignitionAudioRef.current) {
      ignitionAudioRef.current.play().then(() => {
        ignitionAudioRef.current.pause();
        ignitionAudioRef.current.currentTime = 0;
      }).catch((e: any) => console.log("Audio priming blocked", e));
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
            setHasCompletedCooldown(true);
            setIsFinished(true);
            playSuccessSound();
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
      if (isWarmup) return "#ff6b00";
      return "#daff00";
    }
    
    // Manual mode (Cockpit) uses Volt Green when not training/preparing
    if (selectionMode === 'manual' && !isTraining && !isPreparing) return "#daff00";
    
    return "black";
  };

  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const isDefaultPage = selectionMode === 'surprise' && !isTraining && !isPreparing && session.length === 0;

  useEffect(() => {
    if (isDefaultPage) {
      setBgIndex(Math.floor(Math.random() * 3) + 1);
    }
  }, [isDefaultPage]);

  return (
    <>
      {isDefaultPage && (
        <div 
          className="bg-animated" 
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('/Background_${bgIndex}.png')`,
            backgroundPosition: "right center"
          }} 
        />
      )}
      <main style={{ 
        height: (isTraining || isPreparing) ? "100dvh" : "100%", 
        width: "100%",
        overflowY: (isTraining || isPreparing) ? "hidden" : "auto", 
        padding: "1.5rem", 
        paddingTop: "2rem",
        background: isDefaultPage ? "transparent" : currentBackground(),
        transition: "background 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        color: (isTraining || isPreparing) ? ((isPreparing && prepareTime <= 3) ? "black" : "white") : (selectionMode === 'manual' ? "black" : "white"),
        position: (isTraining || isPreparing) ? "fixed" : "relative",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5
      }}>
        {!(isTraining || isPreparing) && (
          <header className="animate" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 
            className="title" 
            onClick={() => {
              setSelectionMode('surprise');
              clearSession();
              setSelectedAreas([]);
              setIsSurfMode(false);
              setIsYogaMode(false);
              setSearchQuery("");
            }}
            style={{ 
              margin: 0, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              lineHeight: "1"
            }}
          >
            <span style={{ 
              color: selectionMode === 'manual' ? "rgba(0,0,0,0.12)" : "white", 
              position: "relative", 
              zIndex: 10,
              fontStyle: "italic"
            }}>X</span>
            <span style={{ overflow: "visible", display: "inline-flex" }}>
              <span 
                data-text="OUT"
                className="logo-out-animate logo-text-shiny-ritual"
                style={{ 
                  color: selectionMode === 'manual' ? "#000000" : "#daff00",
                  '--logo-base-color': selectionMode === 'manual' ? "#000000" : "#daff00",
                  paddingRight: "0.15em",
                  fontStyle: "italic"
                } as any}
              >
                OUT
              </span>
            </span>
          </h1>

          <div style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
            <button
              onClick={() => {
                const nextMode = selectionMode === 'surprise' ? 'manual' : 'surprise';
                setSelectionMode(nextMode);
                clearSession();
              }}
              style={{
                width: "56px",
                height: "56px",
                background: selectionMode === 'manual' ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)",
                color: selectionMode === 'manual' ? "black" : "var(--accent)",
                border: selectionMode === 'manual' ? "1.5px solid rgba(0,0,0,0.1)" : "none",
                borderRadius: "50%",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {selectionMode === 'surprise' ? (
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "28px", height: "28px" }}>
                  <path d="M40.5,5.5H7.5a2,2,0,0,0-2,2v33a2,2,0,0,0,2,2h33a2,2,0,0,0,2-2V7.5A2,2,0,0,0,40.5,5.5Z" />
                  <path d="M24,5.5v37" />
                  <line x1="24" y1="17" x2="42.5" y2="17" />
                  <line x1="24" y1="31" x2="5.5" y2="31" />
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" style={{ width: "34px", height: "34px" }}>
                  <g fillRule="evenodd">
                    <path d="M24.898 100.907a7.97 7.97 0 0 1 8.035-7.935l80.011.623c4.419.034 8.209 3.635 8.466 8.042l.517 8.868 26.68-42.392a7.776 7.776 0 0 1 10.94-2.349l66.996 44.369a8.03 8.03 0 0 1 2.275 11.113l-43.766 66.506c-2.432 3.695-7.447 4.8-11.197 2.47l-51.928-32.265v26.49c0 4.419-3.583 8-7.993 8H32.498a7.949 7.949 0 0 1-7.959-7.998l.36-83.542zm11.828 6.694l-.189 71.811 74.127.073-.035-29.78-5.954-4.119c-1.809-1.25-2.375-3.81-1.257-5.71L111 127l-.466-19.749-73.808.35zM156.483 79L118 138.79l60.965 38.32 37.612-58.539L156.483 79z" />
                    <circle cx="138" cy="135" r="8" />
                    <circle cx="165" cy="130" r="8" />
                    <circle cx="193" cy="125" r="8" />
                    <circle cx="50" cy="124" r="8" />
                    <circle cx="73" cy="145" r="8" />
                    <circle cx="95" cy="123" r="8" />
                    <circle cx="51" cy="165" r="8" />
                    <circle cx="95" cy="165" r="8" />
                  </g>
                </svg>
              )}
            </button>

            <button 
              onClick={() => setIsOptionsOpen(true)}
              style={{
                width: "56px",
                height: "56px",
                background: selectionMode === 'manual' ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)",
                color: selectionMode === 'manual' ? "black" : "white",
                border: selectionMode === 'manual' ? "1.5px solid rgba(0,0,0,0.1)" : "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: "24px", height: "24px" }}>
                <path d="M12,10a2,2,0,1,1-2,2A2,2,0,0,1,12,10ZM4,14a2,2,0,1,0-2-2A2,2,0,0,0,4,14Zm16-4a2,2,0,1,0,2,2A2,2,0,0,0,20,10Z"></path>
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* Options Sidebar Ritual - PERSISTENT SLIDE SUPPORT */}
      <div 
        onClick={() => setIsOptionsOpen(false)}
        style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 999, 
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(5px)",
          visibility: isOptionsOpen ? "visible" : "hidden",
          opacity: isOptionsOpen ? 1 : 0,
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }} 
      />
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: "100vh", 
        background: "#111", 
        borderTop: "1px solid rgba(255,255,255,0.1)", 
        borderTopLeftRadius: "0", 
        borderTopRightRadius: "0", 
        zIndex: 1000, 
        padding: "calc(2.5rem + 40px) 2rem 1.2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
        transform: isOptionsOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform"
      }}>
        <button 
          onClick={() => setIsOptionsOpen(false)} 
          style={{ 
            position: "absolute",
            top: "calc(2.5rem + 20px)",
            right: "2rem",
            background: "none", 
            border: "none", 
            color: "white", 
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
            zIndex: 10
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "0.8rem", fontWeight: "900", letterSpacing: "0.2em", color: "var(--accent)", textTransform: "uppercase" }}>SETTINGS</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Favourite Rituals (Bookmark/Saved Workouts) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "2rem" }}>
            <button 
              onClick={() => { setIsOptionsOpen(false); setIsLibraryOpen(true); }}
              style={{
                width: "64px",
                height: "64px",
                background: savedRituals.length > 0 ? "rgba(217,255,0,0.1)" : "rgba(255,255,255,0.05)",
                color: savedRituals.length > 0 ? "#d9ff00" : "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                position: "relative"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={savedRituals.length > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              {savedRituals.length > 0 && (
                <span style={{ position: "absolute", fontSize: "0.5rem", color: "black", fontWeight: "900", marginTop: "-0.1rem" }}>{savedRituals.length}</span>
              )}
            </button>
            <span style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.1em", opacity: 0.4, color: "white" }}>WORKOUT</span>
          </div>

          {/* No Equipment (RESTORED ICON) */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "2rem" }}>
            <button 
              onClick={() => setNoEquip(!noEquip)}
              style={{
                width: "64px",
                height: "64px",
                background: noEquip ? "var(--accent)" : "rgba(255,255,255,0.05)",
                color: noEquip ? "black" : "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: noEquip ? "0 10px 20px rgba(218, 255, 0, 0.2)" : "none"
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.1797 18C19.5797 18 20.1797 16.65 20.1797 15V9C20.1797 7.35 19.5797 6 17.1797 6C14.7797 6 14.1797 7.35 14.1797 9V15C14.1797 16.65 14.7797 18 17.1797 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                <path d="M6.82031 18C4.42031 18 3.82031 16.65 3.82031 15V9C3.82031 7.35 4.42031 6 6.82031 6C9.22031 6 9.82031 7.35 9.82031 9V15C9.82031 16.65 9.22031 18 6.82031 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                <path opacity="0.4" d="M9.82031 12H14.1803" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                <path opacity="0.4" d="M22.5 14.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                <path opacity="0.4" d="M1.5 14.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            <span style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.1em", opacity: noEquip ? 1 : 0.4, color: "white" }}>NO EQUIP</span>
          </div>

          {/* Favourites */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "2rem" }}>
            <button 
              onClick={() => { setIsOptionsOpen(false); setIsFavoritesOpen(true); }}
              style={{
                width: "64px",
                height: "64px",
                background: favorites.length > 0 ? "rgba(217,255,0,0.1)" : "rgba(255,255,255,0.05)",
                color: favorites.length > 0 ? "var(--accent)" : "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                position: "relative"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {favorites.length > 0 && (
                <span style={{ position: "absolute", fontSize: "0.5rem", color: "black", fontWeight: "900", marginTop: "-0.1rem" }}>{favorites.length}</span>
              )}
            </button>
            <span style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.1em", opacity: 0.4, color: "white" }}>FAVOURITES</span>
          </div>

          {/* Weight Tracker */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "2rem" }}>
            <button 
              onClick={() => { setIsOptionsOpen(false); setIsWeightOpen(true); }}
              style={{
                width: "64px",
                height: "64px",
                background: weights.length > 0 ? "rgba(217,255,0,0.1)" : "rgba(255,255,255,0.05)",
                color: weights.length > 0 ? "var(--accent)" : "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                position: "relative"
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8L13 6M7.0998 7.0011C7.03435 7.32387 7 7.65792 7 8C7 10.7614 9.23858 13 12 13C14.7614 13 17 10.7614 17 8C17 7.65792 16.9656 7.32387 16.9002 7.0011M7.0998 7.0011C7.56264 4.71831 9.58065 3 12 3C14.4193 3 16.4374 4.71831 16.9002 7.0011M7.0998 7.0011C5.87278 7.00733 5.1837 7.04895 4.63803 7.32698C4.07354 7.6146 3.6146 8.07354 3.32698 8.63803C3 9.27976 3 10.1198 3 11.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V11.8C21 10.1198 21 9.27976 20.673 8.63803C20.3854 8.07354 19.9265 7.6146 19.362 7.32698C18.8163 7.04895 18.1272 7.00733 16.9002 7.0011" />
              </svg>
              {weights.length > 0 && (
                <span style={{ position: "absolute", fontSize: "0.5rem", color: "black", fontWeight: "900", marginTop: "-0.1rem" }}>{weights.length}</span>
              )}
            </button>
            <span style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.1em", opacity: 0.4, color: "white" }}>WEIGHT</span>
          </div>

          {/* Timer Tool */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.03)", padding: "1.5rem", borderRadius: "2rem" }}>
            <button 
              onClick={() => { setIsOptionsOpen(false); setIsTimerModalOpen(true); }}
              style={{
                width: "64px",
                height: "64px",
                background: "rgba(255,255,255,0.05)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C16.4183 22 20 18.4183 20 14C20 9.58172 16.4183 6 12 6C7.58172 6 4 9.58172 4 14C4 18.4183 7.58172 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                <path d="M9 2H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
                <path d="M15.24 10.76L12 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> 
              </svg>
            </button>
            <span style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.1em", opacity: 0.4, color: "white" }}>TIMER</span>
          </div>
        </div>
      </div>

        

        {!(isTraining || isPreparing) && selectionMode === 'manual' && (
          <div style={{ paddingBottom: "1.5rem" }} className="animate">

            <div style={{ 
              position: "sticky", 
              top: "-2rem", 
              zIndex: 10,
              background: currentBackground(),
              margin: "1.5rem -1.5rem 0.5rem",
              padding: "2rem 1.5rem 1rem",
              transition: "all 0.3s ease"
            }}>
              {/* SEARCH MODE: full-width bar, no scroll container conflict */}
            {isSearching ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                background: "black",
                borderRadius: "100px",
                width: "100%",
                overflow: "hidden"
              }}>
                <div style={{ padding: "0 0.75rem", display: "flex", alignItems: "center", color: currentAccent, flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    outline: "none",
                    color: selectionMode === 'manual' ? "#daff00" : "white",
                    fontSize: "16px", /* iOS zoom prevention: must be >= 16px */
                    fontWeight: "400",
                    fontFamily: "inherit",
                    letterSpacing: "normal",
                    padding: "0.75rem 0",
                    minWidth: 0
                  }}
                />
                <button 
                  onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                  style={{
                    background: selectionMode === 'manual' ? "black" : "rgba(255,255,255,0.15)",
                    border: "none",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: selectionMode === 'manual' ? "var(--accent)" : "white",
                    flexShrink: 0,
                    marginRight: "0.5rem",
                    marginLeft: "0.5rem",
                    transition: "all 0.2s"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ) : (
              /* CHIPS MODE: scrollable row with search icon chip on the left */
              <div style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }} className="no-scrollbar">
                {/* Search icon chip */}
                <button
                  onClick={() => { setIsSearching(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
                  style={{
                    background: selectionMode === 'manual' ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.12)",
                    border: "none",
                    borderRadius: "100px",
                    width: "42px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    color: selectionMode === 'manual' ? "black" : "rgba(0,0,0,0.65)"
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>

                {/* Specialized Mode Chips (Manual Only) */}
                {selectionMode === 'manual' && (
                  <>
                    <button
                      onClick={() => {
                        setIsSurfMode(!isSurfMode);
                        if (!isSurfMode) setIsYogaMode(false);
                      }}
                      style={{
                        background: isSurfMode ? "rgba(0, 251, 255, 0.6)" : "rgba(0, 251, 255, 0.2)",
                        color: isSurfMode ? "black" : "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        padding: "0.8rem 1.8rem",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        borderRadius: "100px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        letterSpacing: isSurfMode ? "0.2em" : "0.15em",
                        transition: "all 0.2s",
                        flexShrink: 0
                      }}
                    >
                      SURF
                    </button>
                    <button
                      onClick={() => {
                        setIsYogaMode(!isYogaMode);
                        if (!isYogaMode) setIsSurfMode(false);
                      }}
                      style={{
                        background: isYogaMode ? "rgba(224, 0, 255, 0.6)" : "rgba(224, 0, 255, 0.2)",
                        color: isYogaMode ? "white" : "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        padding: "0.8rem 1.8rem",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        borderRadius: "100px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        letterSpacing: isYogaMode ? "0.2em" : "0.15em",
                        transition: "all 0.2s",
                        flexShrink: 0
                      }}
                    >
                      RECOVERY
                    </button>
                  </>
                )}

                {/* Area chips */}
                {BODY_AREAS.map(area => {
                  const isSelected = selectedAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={() => {
                        setSelectedAreas(prev => 
                          prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                        );
                      }}
                      style={{
                        background: isSelected ? "black" : "rgba(0, 0, 0, 0.05)",
                        color: isSelected ? "#daff00" : "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        padding: "0.8rem 1.8rem",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        borderRadius: "100px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        letterSpacing: isSelected ? "0.2em" : "0.15em",
                        transition: "all 0.2s",
                        flexShrink: 0
                      }}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        )}

      {!(isTraining || isPreparing) ? (
        <React.Fragment>
          <section 
          className={`session-list ${selectionMode === 'manual' ? 'animate-up' : ''}`} 
          style={{ 
            paddingBottom: "12rem",
            color: selectionMode === 'manual' ? "black" : "white",
            margin: "0 -1.5rem",
            display: "block"
          }}
        >
          {selectionMode === 'surprise' && session.length === 0 && (
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              flex: 1,
              gap: "1.5rem",
              textAlign: "center",
              paddingTop: "6rem"
            }} className="animate">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 style={{ fontSize: "3.5rem", fontWeight: "900", letterSpacing: "-0.05em", lineHeight: "1.05", margin: 0 }}>
                  <span style={{ fontSize: "2.4rem", color: "rgba(255,255,255,0.2)", display: "block", marginBottom: "0.2rem" }}>Skip the excuses.</span>
                  Not the workout.
                </h2>
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "0.5rem", flexWrap: "wrap" }}>
                  {noEquip && (
                    <span style={{ fontSize: "0.8rem", background: "rgba(255,255,255,0.1)", padding: "0.4rem 1.2rem", borderRadius: "100px", fontWeight: "900", letterSpacing: "0.05em" }}>BODYWEIGHT ONLY</span>
                  )}
                  {isSurfMode && (
                    <span style={{ fontSize: "0.8rem", background: "#01ebff", color: "black", padding: "0.4rem 1.2rem", borderRadius: "100px", fontWeight: "900", letterSpacing: "0.2em" }}>SURF MODE</span>
                  )}
                  {isYogaMode && (
                    <span style={{ fontSize: "0.8rem", background: "#e000ff", color: "white", padding: "0.4rem 1.2rem", borderRadius: "100px", fontWeight: "900", letterSpacing: "0.2em" }}>RECOVERY MODE</span>
                  )}
                  {selectedAreas.length === 0 ? (
                    (!isSurfMode && !isYogaMode) && (
                      <span style={{ fontSize: "0.8rem", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", padding: "0.4rem 1.2rem", borderRadius: "100px", fontWeight: "900", letterSpacing: "0.05em" }}>ALL AREAS</span>
                    )
                  ) : (
                    selectedAreas.map(area => (
                      <span key={area} style={{ fontSize: "0.8rem", background: "var(--accent)", color: "black", padding: "0.4rem 1.2rem", borderRadius: "100px", fontWeight: "900", letterSpacing: "0.05em" }}>{area.toUpperCase()}</span>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "1.2rem", marginTop: "2.5rem" }}>
                <button 
                  onClick={() => { primeAudio(); generateSession(); }}
                  className="button button-shiny"
                  style={{
                    background: "var(--accent)",
                    color: "black",
                    padding: "1.2rem 1.8rem",
                    borderRadius: "100px",
                    fontSize: "1rem",
                    fontWeight: "900",
                    letterSpacing: "0.1em",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.8rem",
                    height: "70px"
                  }}
                >
                  <svg fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" style={{ width: "28px", height: "28px" }}>
                    <g fillRule="evenodd">
                      <path d="M24.898 100.907a7.97 7.97 0 0 1 8.035-7.935l80.011 0.623c4.419 0.034 8.209 3.635 8.466 8.042l0.517 8.868 26.68-42.392a7.776 7.776 0 0 1 10.94-2.349l66.996 44.369a8.03 8.03 0 0 1 2.275 11.113l-43.766 66.506c-2.432 3.695-7.447 4.8-11.197 2.47l-51.928-32.265v26.49c0 4.419-3.583 8-7.993 8H32.498a7.949 7.949 0 0 1-7.959-7.998l0.36-83.542zm11.828 6.694l-0.189 71.811 74.127 0.073-0.035-29.78-5.954-4.119c-1.809-1.25-2.375-3.81-1.257-5.71L111 127l-0.466-19.749-73.808 0.35zM156.483 79L118 138.79l60.965 38.32 37.612-58.539L156.483 79z" />
                      <circle cx="138" cy="135" r="8" />
                      <circle cx="165" cy="130" r="8" />
                      <circle cx="193" cy="125" r="8" />
                      <circle cx="50" cy="124" r="8" />
                      <circle cx="73" cy="145" r="8" />
                      <circle cx="95" cy="123" r="8" />
                      <circle cx="51" cy="165" r="8" />
                      <circle cx="95" cy="165" r="8" />
                    </g>
                  </svg>
                  <span>SURPRISE ME</span>
                </button>

                <button 
                  onClick={() => setIsAreaModalOpen(true)}
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="SVGRepo_iconCarrier">
                      <path d="M8.98501 7.44277L6.04444 7.08897C5.35938 7.00654 5.01683 6.96533 4.7321 7.03647C4.35245 7.13133 4.02904 7.36199 3.83301 7.67769C3.68599 7.91447 3.64149 8.23171 3.55249 8.86619C3.46349 9.50067 3.41899 9.81791 3.49581 10.0816C3.59824 10.4332 3.84728 10.7328 4.18815 10.9143C4.44381 11.0505 5.15392 11.1359 5.83899 11.2183L4.95558 17.5163C4.27051 17.4339 3.5604 17.3484 3.27567 17.4196C2.89602 17.5144 2.57261 17.7451 2.37658 18.0608C2.22956 18.2976 2.18506 18.6148 2.09606 19.2493C2.00706 19.8838 1.96256 20.201 2.03938 20.4647C2.1418 20.8163 2.39085 21.1159 2.73172 21.2974C2.98738 21.4336 3.32992 21.4748 4.01498 21.5572L6.95556 21.911C7.64063 21.9935 7.98317 22.0347 8.2679 21.9635C8.64755 21.8687 8.97096 21.638 9.16699 21.3223C9.31401 21.0855 9.35851 20.7683 9.44751 20.1338C9.53651 19.4993 9.58101 19.1821 9.50419 18.9184C9.40176 18.5668 9.15272 18.2672 8.81185 18.0857C8.55619 17.9495 7.84608 17.8641 7.16101 17.7817L8.04442 11.4837C8.72949 11.5661 9.4396 11.6516 9.72433 11.5804C10.104 11.4856 10.4274 11.2549 10.6234 10.9392C10.7704 10.7024 10.8149 10.3852 10.9039 9.7507C10.9929 9.11623 11.0374 8.79898 10.9606 8.53527C10.8582 8.18366 10.6092 7.88413 10.2683 7.70258C10.0126 7.56641 9.67007 7.5252 8.98501 7.44277Z" fill="currentColor"></path>
                      <path d="M20.2855 16.0833L17.5741 16.7826C16.9424 16.9456 16.6266 17.027 16.3498 16.992C15.9807 16.9452 15.6461 16.7592 15.4195 16.4749C15.2496 16.2617 15.1649 15.9577 14.9957 15.3496C14.8264 14.7416 14.7418 14.4375 14.7782 14.1711C14.8268 13.8158 15.02 13.4937 15.3153 13.2756C15.5368 13.112 16.1916 12.9431 16.8233 12.7801L15.1432 6.74438C14.5115 6.90732 13.8567 7.0762 13.5799 7.04112C13.2109 6.99435 12.8762 6.80837 12.6496 6.52409C12.4797 6.31089 12.3951 6.00685 12.2258 5.39879C12.0565 4.79072 11.9719 4.48669 12.0084 4.22024C12.0569 3.86498 12.2501 3.54285 12.5455 3.32472C12.767 3.16112 13.0828 3.07965 13.7145 2.91672L16.4259 2.21736C17.0576 2.05443 17.3734 1.97296 17.6502 2.00804C18.0193 2.05481 18.3539 2.24079 18.5805 2.52507C18.7504 2.73828 18.8351 3.04232 19.0043 3.65038C19.1736 4.25844 19.2582 4.56248 19.2218 4.82892C19.1732 5.18418 18.98 5.50631 18.6847 5.72445C18.4632 5.88805 17.8084 6.05693 17.1767 6.21986L18.8568 12.2556C19.4885 12.0927 20.1433 11.9238 20.4201 11.9589C20.7891 12.0056 21.1238 12.1916 21.3504 12.4759C21.5203 12.6891 21.6049 12.9932 21.7742 13.6012C21.9435 14.2093 22.0281 14.5133 21.9916 14.7798C21.9431 15.135 21.7499 15.4571 21.4545 15.6753C21.233 15.8389 20.9172 15.9203 20.2855 16.0833Z" fill="currentColor"></path>
                    </g>
                  </svg>
                </button>
              </div>
              </div>
        )}

          {(searchQuery.trim() ? availableExercises : (selectionMode === 'surprise' ? session : availableExercises)).map((ex, i) => {
            const isAdded = session.some(r => r.id === ex.id);
            const currentDuration = isAdded ? session.find(r => r.id === ex.id)?.duration : globalDuration;
            
            return (
              <div 
                key={`${ex.id}-${i}`} 
                className="exercise-card animate" 
                style={{ 
                  animationDelay: `${i * 0.05}s`,
                  position: "relative",
                  background: "transparent",
                  borderRadius: "0",
                  margin: "0",
                  padding: "2rem 1.5rem",
                  border: "none",
                  borderBottom: selectionMode === 'manual' ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: "0.5rem" }}>
                  {/* Removed badge tag */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(ex.name); }}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        padding: "8px", 
                        margin: "-8px",
                        cursor: "pointer", 
                        color: favorites.includes(ex.name) ? (selectionMode === 'manual' ? "black" : "white") : (selectionMode === 'manual' ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.2)"),
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={favorites.includes(ex.name) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    <span style={{ 
                      fontSize: "1.5rem", 
                      fontWeight: "900", 
                      opacity: selectionMode === 'manual' ? 0.2 : 0.4,
                      color: selectionMode === 'manual' ? "black" : "white",
                      letterSpacing: "-0.05em"
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ 
                    display: "inline-block",
                    padding: "0.2rem 0.5rem", 
                    background: selectionMode === 'manual' ? "black" : "rgba(255,255,255,0.1)", 
                    color: selectionMode === 'manual' ? "var(--accent)" : "white",
                    fontSize: "0.75rem",
                    fontWeight: "900",
                    borderRadius: "4px",
                    textTransform: "uppercase"
                  }}>
                    {ex.id.startsWith('w') ? 'WARMUP' : ex.id.startsWith('c') ? 'COOLDOWN' : (ex as any).bodyArea || 'EXERCISE'}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ 
                    fontSize: "2rem", 
                    fontWeight: "400", 
                    letterSpacing: "-0.01em", 
                    marginBottom: "0",
                    color: selectionMode === 'manual' ? "black" : "white"
                  }}>
                    {ex.name}
                  </h3>
                </div>
                
                <p style={{ 
                  fontSize: "0.9rem", 
                  opacity: 0.5, 
                  lineHeight: "1.5",
                  marginTop: "0.5rem",
                  marginBottom: "1.5rem",
                  color: selectionMode === 'manual' ? "black" : "white",
                  paddingRight: selectionMode === 'surprise' ? "4.5rem" : "0" // Avoid clash with swap icon
                }}>
                  {ex.desc}
                </p>
                


                {selectionMode === 'manual' && (
                  <button 
                    onClick={() => addToSession(ex)}
                    style={{
                      background: isAdded ? "black" : "transparent",
                      color: isAdded ? currentAccent : "black",
                      border: "1px solid black",
                      width: "100%",
                      padding: "1.2rem",
                      borderRadius: "100px",
                      fontSize: "0.8rem",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {isAdded ? "REMOVE FROM SESSION" : "ADD TO SESSION"}
                  </button>
                )}

                {selectionMode === 'surprise' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); swapExercise(i); }}
                    style={{
                      position: "absolute",
                      bottom: "1.5rem",
                      right: "1.5rem",
                      width: "52px",
                      height: "52px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--accent)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      zIndex: 10
                    }}
                  >
                    <svg viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ width: "24px", height: "24px" }}>
                      <g transform="translate(46.976875, 46.976875)">
                        <path d="M379.689791,38.3564581 L379.689791,379.689791 L38.3564581,379.689791 L38.3564581,38.3564581 L379.689791,38.3564581 Z M337.023125,81.0231247 L81.0231247,81.0231247 L81.0231247,337.023125 L337.023125,337.023125 L337.023125,81.0231247 Z M283.689791,251.689791 C301.362903,251.689791 315.689791,266.016679 315.689791,283.689791 C315.689791,301.362903 301.362903,315.689791 283.689791,283.689791 C266.016679,315.689791 251.689791,301.362903 251.689791,283.689791 C251.689791,266.016679 266.016679,251.689791 283.689791,251.689791 Z M209.023125,177.023125 C226.696237,177.023125 241.023125,191.350013 241.023125,209.023125 C241.023125,226.696237 226.696237,241.023125 209.023125,241.023125 C191.350013,241.023125 177.023125,226.696237 177.023125,209.023125 C177.023125,191.350013 191.350013,177.023125 209.023125,177.023125 Z M134.356458,102.356458 C152.02957,102.356458 166.356458,116.683346 166.356458,134.356458 C166.356458,152.02957 152.02957,166.356458 134.356458,166.356458 C116.683346,166.356458 102.356458,152.02957 102.356458,134.356458 C102.356458,116.683346 116.683346,102.356458 134.356458,102.356458 Z" transform="translate(209.023125, 209.023125) rotate(-345.000000) translate(-209.023125, -209.023125) "></path>
                      </g>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </section>
          
        {(session.length > 0 || manualSession.length > 0) && !(isTraining || isPreparing) && (
          <React.Fragment>
          <div style={{ 
            position: "fixed", 
            bottom: "0", 
            left: "0", 
            right: "0", 
            zIndex: 100,
            background: selectionMode === 'manual' ? "#daff00" : "rgba(0,0,0,0.95)",
            padding: "1.5rem 1.5rem 2.5rem 1.5rem",
            borderTop: selectionMode === 'manual' ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            {selectionMode === 'manual' && (
              <div style={{ marginBottom: "1.2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                  <button 
                    onClick={() => setIsTrayExpanded(!isTrayExpanded)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.6rem", 
                      fontSize: "0.8rem", 
                      fontWeight: "900", 
                      textTransform: "uppercase", 
                      letterSpacing: "0.1em",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "black"
                    }}
                  >
                    <span style={{ color: "black" }}>{session.length} / {maxExercises} MOVEMENTS</span>
                    <svg style={{ transform: isTrayExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>
                  <button 
                    onClick={clearSession}
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "rgba(0,0,0,0.5)", 
                      fontSize: "0.7rem", 
                      fontWeight: "900", 
                      cursor: "pointer", 
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" 
                    }}
                  >
                    RESET
                  </button>
                </div>
                <div style={{ height: "4px", background: "rgba(0,0,0,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ 
                    height: "100%", 
                    background: "black", 
                    width: `${(session.length / maxExercises) * 100}%`,
                    transition: "width 0.3s ease" 
                  }} />
                </div>
              </div>
            )}

            {/* EXPANDABLE TRAY - FULL PAGE RITUAL */}
            <div style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              height: "100vh",
              background: "#daff00",
              zIndex: 2000,
              transform: isTrayExpanded ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.45s cubic-bezier(0.2, 1, 0.3, 1)",
              display: "flex",
              flexDirection: "column",
              color: "black",
              willChange: "transform",
              boxShadow: isTrayExpanded ? "0 -20px 60px rgba(0,0,0,0.15)" : "none",
              overflow: "hidden"
            }}>
              {/* Tray Header */}
              <div style={{ 
                padding: "3.5rem 1.5rem 2rem", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                borderBottom: "1px solid rgba(0,0,0,0.1)"
              }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.02em" }}>CURRENT WORKOUT</h2>
                  <span style={{ fontSize: "0.6rem", opacity: 0.5, letterSpacing: "0.1em", fontWeight: "900" }}>{session.length} MOVEMENTS TO START</span>
                </div>
                <button 
                  onClick={() => setIsTrayExpanded(false)}
                  style={{ 
                    background: "black", 
                    color: "#daff00", 
                    border: "none", 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "50%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Tray List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }} className="no-scrollbar">
                {session.map((ex, i) => (
                  <div key={`${ex.id}-tray-${i}`} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "1.2rem 0", 
                    borderBottom: "1px solid rgba(0,0,0,0.05)" 
                  }}>
                    <div>
                      <div style={{ fontSize: "0.6rem", fontWeight: "900", opacity: 0.5, letterSpacing: "0.1em" }}>{String(i + 1).padStart(2, '0')}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "900" }}>{ex.name}</div>
                        {favorites.includes(ex.name) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.3 }}>
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <button 
                          onClick={() => moveExercise(i, 'up')}
                          disabled={i === 0}
                          style={{ background: "none", border: "none", color: "black", opacity: i === 0 ? 0.1 : 0.4, cursor: "pointer", padding: "4px" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15"></polyline>
                          </svg>
                        </button>
                        <button 
                          onClick={() => moveExercise(i, 'down')}
                          disabled={i === session.length - 1}
                          style={{ background: "none", border: "none", color: "black", opacity: i === session.length - 1 ? 0.1 : 0.4, cursor: "pointer", padding: "4px" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromSession(ex.id)}
                        style={{ background: "none", border: "none", color: "rgba(0,0,0,0.3)", padding: "10px", cursor: "pointer" }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tray Footer */}
              <div style={{ padding: "2rem 1.5rem 4rem 1.5rem", borderTop: "1px solid rgba(0,0,0,0.1)", background: "#daff00" }}>
                <button 
                  onClick={() => { setIsTrayExpanded(false); startSession(); }}
                  style={{
                    background: "black",
                    color: "#daff00",
                    border: "none",
                    width: "100%",
                    padding: "1.2rem",
                    borderRadius: "100px",
                    fontSize: "1.2rem",
                    fontWeight: "900",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
                  }}
                >
                  START SESSION
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", justifyContent: "center" }}>
              <button 
                onClick={() => setIsTimeSheetOpen(true)}
                style={{ 
                  flex: "0 0 60px", 
                  width: "60px",
                  height: "60px", 
                  borderRadius: "999px", 
                  background: selectionMode === 'manual' ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)", 
                  border: "none", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: selectionMode === 'manual' ? "black" : "white"
                }}
              >
                <svg style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.24 2H8.76004C5.00004 2 4.71004 5.38 6.74004 7.22L17.26 16.78C19.29 18.62 19 22 15.24 22H8.76004C5.00004 22 4.71004 18.62 6.74004 16.78L17.26 7.22C19.29 5.38 19 2 15.24 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>

              {selectionMode !== 'manual' && (
                <button 
                  className="generate-btn" 
                  onClick={generateSession}
                  style={{ 
                    flex: "0 0 60px", 
                    width: "60px",
                    height: "60px", 
                    padding: 0, 
                    borderRadius: "999px", 
                    background: "rgba(255,255,255,0.05)", 
                    border: "0.5px solid rgba(255,255,255,0.1)", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center" 
                  }}
                >
                  <span style={{ 
                    fontSize: selectionMode === 'surprise' ? "1.8rem" : "0.7rem", 
                    color: "white", 
                    fontWeight: "900" 
                  }}>
                    {selectionMode === 'surprise' ? "⟳" : "AUTO"}
                  </span>
                </button>
              )}

              <button 
                onClick={saveWorkout}
                style={{ 
                  flex: "0 0 64px", 
                  width: "64px",
                  height: "64px", 
                  borderRadius: "999px", 
                  background: (isSaved || isCurrentSessionSaved) ? (selectionMode === 'manual' ? "rgba(0,0,0,0.1)" : "rgba(217,255,0,0.1)") : (selectionMode === 'manual' ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"),
                  color: (isSaved || isCurrentSessionSaved) ? (selectionMode === 'manual' ? "black" : "#d9ff00") : (selectionMode === 'manual' ? "rgba(0,0,0,0.4)" : "white"),
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                <svg style={{ width: "22px", height: "22px" }} viewBox="0 0 24 24" fill={(isSaved || isCurrentSessionSaved) ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
              
              {session.length > 0 && (
                <button 
                  className="button" 
                  onClick={startSession}
                  style={{ 
                    width: "80px", 
                    height: "80px", 
                    flex: "0 0 80px",
                    fontSize: "1.2rem", 
                    letterSpacing: "0.1em", 
                    fontWeight: "900", 
                    borderRadius: "50%",
                    background: selectionMode === 'manual' ? "black" : "var(--accent)",
                    color: selectionMode === 'manual' ? "#daff00" : "black",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: selectionMode === 'manual' ? "0 10px 20px rgba(0,0,0,0.15)" : "0 10px 20px rgba(218, 255, 0, 0.2)"
                  }}
                >
                  GO
                </button>
              )}
            </div>
          </div>
          </React.Fragment>
        )}
        </React.Fragment>
        ) : (
        <section style={{ 
          flex: 1,
          display: "flex",
          flexDirection: "column", 
          justifyContent: "space-between",
          color: (isPreparing && prepareTime <= 3) ? "black" : "white",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          position: "relative"
        }}>
          {/* TOP PROGRESS RITUAL - 1PX ACCENT LINE */}
          <div style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            width: "100%", 
            height: "2px", 
            background: "rgba(255,255,255,0.05)", 
            zIndex: 1000 
          }}>
            <div style={{ 
              width: `${(elapsedTime / (totalTrainingTime || 1)) * 100}%`, 
              height: "100%", 
              background: "var(--accent)", 
              transition: "width 1s linear" 
            }} />
          </div>

          {/* Round Progress Ritual - Persistent across movement and recovery */}
          <div style={{ 
            textAlign: "center", 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center",
            padding: "2rem 1rem 0"
          }} className={isPreparing ? "animate" : ""}>
            <span style={{ 
              fontSize: "1rem", 
              fontWeight: "900", 
              letterSpacing: "0.2em", 
              color: (isPreparing && prepareTime <= 3) ? "black" : "var(--accent)",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
              display: "block"
            }}>
              {isPreparing ? "GET READY" : (trainingSession[currentIndex]?.bodyArea || "EXERCISE")}
            </span>
            <h2 style={{ 
              fontSize: "2.8rem", 
              fontWeight: "900", 
              marginBottom: "1rem", 
              lineHeight: 1, 
              color: (isPreparing && prepareTime <= 3) ? "black" : "white" 
            }}>
              {trainingSession[currentIndex]?.name}
            </h2>
            <p style={{ 
              fontSize: "1rem", 
              fontWeight: "500",
              opacity: 0.6, 
              maxWidth: "85%", 
              margin: "0 auto 1.5rem", 
              lineHeight: 1.4, 
              color: (isPreparing && prepareTime <= 3) ? "black" : "white" 
            }}>
              {trainingSession[currentIndex]?.desc}
            </p>
            
            <div style={{ 
              fontSize: "11rem", 
              fontWeight: "900",
              color: (isPreparing && prepareTime <= 3) ? "black" : "white",
              textShadow: (isPreparing && prepareTime <= 3) ? "none" : "0 0 40px rgba(255,255,255,0.1)",
              position: "relative"
            }}>
              {isPreparing ? prepareTime : timeLeft}
              {/* ZEN BREATHING UI FOR COOLDOWN */}
              {isCooldown && !isPreparing && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  border: "2px solid var(--accent)",
                  opacity: 0.3,
                  animation: "breath 4s ease-in-out infinite"
                }} />
              )}
            </div>
          </div>

          <div style={{ 
            marginTop: "auto", 
            paddingBottom: "3rem",
            background: `linear-gradient(to top, ${currentBackground()} 80%, transparent)`,
            transition: "background 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "sticky",
            bottom: 0,
            zIndex: 10
          }}>
            {/* Total time label */}
            <div style={{ textAlign: "center", opacity: 0.6, letterSpacing: "0.2em", fontSize: "1.4rem", marginBottom: "1rem", fontWeight: "900", color: (isPreparing && prepareTime <= 3) ? "black" : "white" }}>
              REMAINING: {formatTime(Math.max(0, totalTrainingTime - elapsedTime))}
            </div>
            {/* Controls row — centered */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" }}>
              {/* MUTE TOGGLE RITUAL */}
              <button 
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                style={{
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: isVoiceMuted ? "rgba(255,255,255,0.05)" : "black",
                  color: isVoiceMuted ? "rgba(255,255,255,0.3)" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {isVoiceMuted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9l-5 5H2v-4h2l5 5zM11 5L6 10M11 19l-5-5"></path></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                )}
              </button>

              <button 
                onClick={() => {
                  if (!isPaused && typeof window !== "undefined" && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsPaused(!isPaused);
                }}
                style={{
                  width: "64px", 
                  height: "64px", 
                  borderRadius: "50%", 
                  border: (isPreparing && prepareTime <= 3) ? "none" : "1px solid rgba(255,255,255,0.2)",
                  background: "black",
                  color: (isPreparing && prepareTime <= 3) ? "var(--accent)" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {isPaused ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> 
                )}
              </button>

              <button 
                onClick={stopSession}
                style={{
                  width: "90px", 
                  height: "90px", 
                  borderRadius: "50%", 
                  background: (isPreparing && prepareTime <= 3) ? "black" : "var(--accent)",
                  border: "none",
                  color: (isPreparing && prepareTime <= 3) ? "var(--accent)" : "black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ width: "24px", height: "24px", background: "currentColor", borderRadius: "2px" }} />
              </button>

              <button 
                onClick={skipToNext}
                style={{
                  width: "64px", 
                  height: "64px", 
                  borderRadius: "50%", 
                  background: (isPreparing && prepareTime <= 3) ? "black" : "white",
                  border: "none",
                  color: (isPreparing && prepareTime <= 3) ? "white" : "black",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease"
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            {/* UP NEXT — full-width cockpit readout */}
            <div
              style={{
                width: "100%",
                padding: "1rem",
                background: "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ 
                fontSize: "1.1rem", 
                fontWeight: "900",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: (isPreparing && prepareTime <= 3) ? "black" : "white",
                opacity: 0.6
              }}>
                {currentIndex >= trainingSession.length - 1 
                  ? "— FINISH —" 
                  : isWarmup
                    ? "WARM UP"
                    : isCooldown 
                      ? "COOLDOWN" 
                    : (
                      <button 
                        onClick={() => setTimeLeft(0)}
                        style={{ background: "none", border: "none", color: "inherit", font: "inherit", cursor: "pointer", padding: 0 }}
                      >
                         {`ROUND ${Math.floor(currentIndex / (session.length || 1)) + 1} / ${totalRounds}`}
                      </button>
                    )}
              </div>
            </div>
          </div>
        </section>
      )}
  
      {isSplashActive && (
        <div className={`splash-screen ${isSplashExiting ? 'exit' : ''}`}>
          <div className="splash-panel splash-panel-left"></div>
          <div className="splash-panel splash-panel-right"></div>
          <h1 
            className="title"
            style={{ 
              margin: 0, 
              display: "flex",
              alignItems: "center",
              lineHeight: "1",
              fontFamily: "var(--font-sans)"
            }}
          >
            <span style={{ color: "white", position: "relative", zIndex: 10, fontStyle: "italic" }}>X</span>
            <span style={{ overflow: "visible", display: "inline-flex" }}>
              <span 
                data-text="OUT"
                className="logo-out-animate logo-text-shiny-ritual"
                style={{ 
                  color: "#daff00",
                  '--logo-base-color': "#daff00",
                  paddingRight: "0.15em",
                  fontStyle: "italic"
                } as any}
              >
                OUT
              </span>
            </span>
          </h1>
        </div>
      )}
    </main>

      {isFinished && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "black",
          zIndex: 3000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          overflow: "hidden"
        }} className="animate-fade">
          {/* Cinematic Background Ritual */}
          <div style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "url('/Background.jpeg') center/cover no-repeat",
            opacity: 0.15,
            zIndex: 1,
            pointerEvents: "none",
            filter: "grayscale(100%) brightness(0.5)"
          }} />

          {/* Close Ritual Button - Top Right Corner */}
          <button 
            onClick={() => { setIsFinished(false); stopSession(); }}
            style={{
              position: "absolute",
              top: "1.2rem",
              right: "1.2rem",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100,
              cursor: "pointer"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* THE CALORIE TERMINAL - BORDERLESS */}
          <div style={{ 
            position: "relative", 
            zIndex: 10, 
            width: "100%", 
            maxWidth: "360px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.4rem" }}>
              <h2 style={{ 
                fontSize: "12rem", 
                fontWeight: "900", 
                color: "var(--accent)", 
                letterSpacing: "-0.04em", 
                lineHeight: 0.8, 
                margin: 0,
                filter: "drop-shadow(0 0 40px rgba(218, 255, 0, 0.3))"
              }}>{Math.round(finalTabataStats ? finalTabataStats.calories : caloriesBurned)}</h2>
              <span style={{ fontSize: "1.6rem", fontWeight: "900", color: "white", opacity: 0.4 }}>KCAL</span>
            </div>
            
            {/* TOTAL SESSION TIME RITUAL */}
            <div style={{ 
              marginTop: "2.5rem",
              fontSize: "1rem",
              fontWeight: "900",
              color: "white",
              opacity: 0.9,
              letterSpacing: "0.4em"
            }}>
              {finalTabataStats 
                ? `${Math.floor(finalTabataStats.duration / 60)}:${(finalTabataStats.duration % 60).toString().padStart(2, '0')}`
                : `${Math.floor((totalSessionDuration * totalRounds) / 60)}:${( (totalSessionDuration * totalRounds) % 60).toString().padStart(2, '0')}`
              } TOTAL TIME
            </div>
          </div>

          {/* PRIMARY ACTIONS RITUAL */}
          <div style={{ 
            position: "relative", 
            zIndex: 10, 
            display: "flex", 
            flexDirection: "column",
            width: "100%",
            maxWidth: "280px",
            gap: "1rem",
            marginTop: "3rem"
          }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              {!hasCompletedCooldown && (
                <button 
                  onClick={startCooldown}
                  style={{
                    flex: 1,
                    height: "88px",
                    borderRadius: "100px",
                    background: "var(--accent)",
                    color: "black",
                    border: "none",
                    fontWeight: "900",
                    fontSize: "1rem",
                    letterSpacing: "0.15em",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 40px rgba(218, 255, 0, 0.2)"
                  }}
                >
                  COOL DOWN
                </button>
              )}
            </div>

            {/* SAVE WORKOUT BUTTON AS TILE ACTION */}
            {isCurrentSessionSaved ? (
              <div style={{ 
                height: "64px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
                fontSize: "0.75rem",
                fontWeight: "900",
                letterSpacing: "0.2em",
                opacity: 0.8
              }}>
                WORKOUT ARCHIVED ✓
              </div>
            ) : (
              <button 
                onClick={saveWorkout}
                style={{ 
                  height: "64px",
                  background: "rgba(255,255,255,0.04)", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "100px",
                  color: "rgba(255,255,255,0.6)", 
                  fontFamily: "inherit",
                  fontSize: "0.75rem",
                  fontWeight: "900",
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                SAVE WORKOUT
              </button>
            )}
          </div>
        </div>
      )}

      {isTimerModalOpen && (
        <div 
          className="modal-overlay animate-fade-in"
          style={{ 
            position: "fixed",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            background: (isTimerPreparing && timerPrepareTime <= 3) ? "var(--accent)" : "black",
            zIndex: 10000,
            overflowY: "auto",
            padding: "20px"
          }}
        >
          <div className="scanline-effect" />

          {/* 1. TOP BAR: LOGO & CLOSE */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", zIndex: 100 }}>
            <h1 
              className="title"
              onClick={() => { setIsTimerModalOpen(false); setIsTimerRunning(false); setIsTimerPreparing(false); }}
              style={{ 
                margin: 0, 
                display: "flex",
                alignItems: "center",
                lineHeight: "1",
                cursor: "pointer"
              }}
            >
              <span style={{ color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white", position: "relative", zIndex: 10, fontStyle: "italic" }}>X</span>
              <span style={{ overflow: "visible", display: "inline-flex" }}>
                <span 
                  data-text="OUT"
                  className="logo-out-animate logo-text-shiny-ritual"
                  style={{ 
                    color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "#daff00",
                    '--logo-base-color': (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "#daff00",
                    paddingRight: "0.15em",
                    fontStyle: "italic"
                  } as React.CSSProperties}
                >OUT</span>
              </span>
            </h1>
            <button 
              onClick={() => { setIsTimerModalOpen(false); setIsTimerRunning(false); setIsTimerPreparing(false); }}
              style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "50%", 
                background: (isTimerPreparing && timerPrepareTime <= 3) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)", 
                border: "none", 
                color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer" 
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* 2. SWITCHER */}
          {!(isTimerRunning || isTimerPreparing) && (
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "24px", zIndex: 100 }}>
              <button onClick={() => { setTimerMode('stopwatch'); setTimerSeconds(0); setInitialTimerSeconds(0); }} style={{ flex: 1, padding: "0.8rem", borderRadius: "100px", border: "none", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "0.2em", cursor: "pointer", background: timerMode === 'stopwatch' ? "var(--accent)" : "none", color: timerMode === 'stopwatch' ? "black" : "rgba(255,255,255,0.4)" }}>STOPWATCH</button>
              <button onClick={() => { setTimerMode('countdown'); setTimerSeconds(60); setInitialTimerSeconds(60); }} style={{ flex: 1, padding: "0.8rem", borderRadius: "100px", border: "none", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "0.2em", cursor: "pointer", background: timerMode === 'countdown' ? "var(--accent)" : "none", color: timerMode === 'countdown' ? "black" : "rgba(255,255,255,0.4)" }}>COUNTDOWN</button>
              <button onClick={() => { setTimerMode('tabata'); setTimerSeconds(20); setInitialTimerSeconds(20); setTabataPhase('work'); setCurrentTabataRound(1); }} style={{ flex: 1, padding: "0.8rem", borderRadius: "100px", border: "none", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "0.2em", cursor: "pointer", background: timerMode === 'tabata' ? "var(--accent)" : "none", color: timerMode === 'tabata' ? "black" : "rgba(255,255,255,0.4)" }}>TABATA</button>
            </div>
          )}


          {/* 4. ACTIVE STATUS BAR (ONLY WHEN RUNNING/PREPPING) */}
          {(isTimerRunning || isTimerPreparing) && (
            <div style={{ textAlign: "center", marginBottom: "30px", marginTop: "60px" }}>
              <div style={{ 
                fontSize: "1.8rem", 
                fontWeight: "900", 
                letterSpacing: "0.3em", 
                color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "var(--accent)", 
                textTransform: "uppercase",
                marginBottom: "12px"
              }}>
                {isTimerPreparing ? "GET READY" : (timerMode === 'tabata' ? tabataPhase : "GO")}
              </div>
              {timerMode === 'tabata' && (
                <div style={{ 
                  fontSize: "2.8rem", 
                  fontWeight: "900", 
                  letterSpacing: "0.1em",
                  color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white"
                }}>
                  ROUND {Math.min(currentTabataRound, tabataRounds)} / {tabataRounds}
                </div>
              )}
            </div>
          )}

          {/* 4. MASSIVE DIGITS */}
          <div style={{ 
            fontSize: "min(35vw, 11rem)", fontWeight: "900", letterSpacing: "-0.05em", textAlign: "center", lineHeight: 1, marginBottom: "20px",
            paddingTop: (isTimerRunning || isTimerPreparing) ? "0px" : "20px",
            color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white",
            textShadow: (isTimerPreparing && timerPrepareTime <= 3) ? "none" : "0 0 40px rgba(255,255,255,0.1)",
            fontVariantNumeric: "tabular-nums"
          }}>
            {isTimerPreparing ? timerPrepareTime : (
              (timerMode === 'tabata' && !isTimerRunning && !isTimerPreparing) 
                ? formatTime(20) // Start with 20s work
                : formatTime(timerSeconds)
            )}
          </div>

          {/* 5. TELEMETRY BAR (TOTAL TIME & CALORIES) */}
          {timerMode === 'tabata' && (isTimerRunning || isTimerPreparing || currentTabataRound > 1 || (tabataPhase === 'work' && timerSeconds < 20)) && (
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "3rem", 
              marginBottom: "30px",
              marginTop: "-10px",
              opacity: (isTimerPreparing && timerPrepareTime <= 3) ? 1 : 0.8,
              color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white",
              zIndex: 100
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.2em", marginBottom: "2px", opacity: 0.5 }}>TOTAL REMAINING</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", letterSpacing: "0.05em" }}>
                  {formatTime(Math.max(0, tabataTotalDuration - tabataElapsedSeconds))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: "900", letterSpacing: "0.2em", marginBottom: "2px", opacity: 0.5 }}>CALORIES</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "900", letterSpacing: "0.05em" }}>
                  {Math.floor(caloriesBurnedLive)}<span style={{ fontSize: "0.7rem", marginLeft: "2px", opacity: 0.5 }}>KCAL</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. MODE-SPECIFIC CONTROLS (STABILIZED CONTAINER) */}
          <div style={{ 
            minHeight: (isTimerRunning || isTimerPreparing) ? "20px" : "140px", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "center", 
            marginBottom: (isTimerRunning || isTimerPreparing) ? "0px" : "24px",
            transition: "all 0.3s ease"
          }}>
            {timerMode === 'countdown' && !(isTimerRunning || isTimerPreparing) && (
              <div style={{ display: "flex", justifyContent: "center", gap: "0.8rem", flexWrap: "wrap" }}>
                {[30, 50, 60, 120].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => { setTimerSeconds(s); setInitialTimerSeconds(s); }} 
                    style={{ 
                      padding: "0.8rem 1.2rem", 
                      background: timerSeconds === s ? ((isTimerPreparing && timerPrepareTime <= 3) ? "black" : "var(--accent)") : "rgba(255,255,255,0.05)", 
                      color: timerSeconds === s ? ((isTimerPreparing && timerPrepareTime <= 3) ? "var(--accent)" : "black") : ((isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white"), 
                      border: timerSeconds === s ? "none" : ((isTimerPreparing && timerPrepareTime <= 3) ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)"), 
                      borderRadius: "100px", 
                      fontSize: "0.85rem", 
                      fontWeight: "900", 
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {s < 60 ? `${s}S` : `${s/60}M`}
                  </button>
                ))}
              </div>
            )}

            {timerMode === 'tabata' && !(isTimerRunning || isTimerPreparing) && (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem" }}>
                  <button 
                    onClick={() => setTabataRounds(r => Math.max(1, r - 1))}
                    style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "1.5rem", fontWeight: "900", cursor: "pointer" }}
                  >
                    -
                  </button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.5, letterSpacing: "0.2em", marginBottom: "4px" }}>ROUNDS</div>
                    <div style={{ fontSize: "3rem", fontWeight: "900", lineHeight: 1 }}>{tabataRounds}</div>
                  </div>
                  <button 
                    onClick={() => setTabataRounds(r => r + 1)}
                    style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "1.5rem", fontWeight: "900", cursor: "pointer" }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* 7. PLAY BUTTON (HEROIC ACTION BAR) */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2rem", marginTop: "20px", paddingBottom: "180px" }}>
            <div style={{ width: "80px", display: "flex", justifyContent: "center" }}>
              <button 
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                style={{ 
                  width: "80px", 
                  height: "80px", 
                  borderRadius: "50%", 
                  border: (isTimerPreparing && timerPrepareTime <= 3) ? "1px solid rgba(0,0,0,0.2)" : "1px solid rgba(255,255,255,0.1)", 
                  background: (isTimerPreparing && timerPrepareTime <= 3) ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", 
                  color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {isVoiceMuted ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2.5 C12.7796706,2.5 13.4204457,3.09488554 13.4931332,3.85553954 L13.5,4 L13.5,20 C13.5,20.8284 12.8284,21.5 12,21.5 C11.2203294,21.5 10.5795543,20.9050879 10.5068668,20.1444558 L10.5,20 L10.5,4 C10.5,3.17157 11.1716,2.5 12,2.5 Z M8,5.5 C8.82843,5.5 9.5,6.17157 9.5,7 L9.5,17 C9.5,17.8284 8.82843,18.5 8,18.5 C7.17157,18.5 6.5,17.8284 6.5,17 L6.5,7 C6.5,6.17157 7.17157,5.5 8,5.5 Z M16,5.5 C16.8284,5.5 17.5,6.17157 17.5,7 L17.5,17 C17.5,17.8284 16.8284,18.5 16,18.5 C15.1716,18.5 14.5,17.8284 14.5,17 L14.5,7 C14.5,6.17157 15.1716,5.5 16,5.5 Z M4,8.5 C4.82843,8.5 5.5,9.17157 5.5,10 L5.5,14 C5.5,14.8284 4.82843,15.5 4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 L2.5,10 C2.5,9.17157 3.17157,8.5 4,8.5 Z M20,8.5 C20.7796706,8.5 21.4204457,9.09488554 21.4931332,9.85553954 L21.5,10 L21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 C19.2203294,15.5 18.5795543,14.9050879 18.5068668,14.1444558 L18.5,14 L18.5,10 C18.5,9.17157 19.1716,8.5 20,8.5 Z" opacity="0.4" />
                  <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2.5 C12.7796706,2.5 13.4204457,3.09488554 13.4931332,3.85553954 L13.5,4 L13.5,20 C13.5,20.8284 12.8284,21.5 12,21.5 C11.2203294,21.5 10.5795543,20.9050879 10.5068668,20.1444558 L10.5,20 L10.5,4 C10.5,3.17157 11.1716,2.5 12,2.5 Z M8,5.5 C8.82843,5.5 9.5,6.17157 9.5,7 L9.5,17 C9.5,17.8284 8.82843,18.5 8,18.5 C7.17157,18.5 6.5,17.8284 6.5,17 L6.5,7 C6.5,6.17157 7.17157,5.5 8,5.5 Z M16,5.5 C16.8284,5.5 17.5,6.17157 17.5,7 L17.5,17 C17.5,17.8284 16.8284,18.5 16,18.5 C15.1716,18.5 14.5,17.8284 14.5,17 L14.5,7 C14.5,6.17157 15.1716,5.5 16,5.5 Z M4,8.5 C4.82843,8.5 5.5,9.17157 5.5,10 L5.5,14 C5.5,14.8284 4.82843,15.5 4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 L2.5,10 C2.5,9.17157 3.17157,8.5 4,8.5 Z M20,8.5 C20.7796706,8.5 21.4204457,9.09488554 21.4931332,9.85553954 L21.5,10 L21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 C19.2203294,15.5 18.5795543,14.9050879 18.5068668,14.1444558 L18.5,14 L18.5,10 C18.5,9.17157 19.1716,8.5 20,8.5 Z" />
                </svg>
              )}
              </button>
            </div>

            <button 
              onClick={() => { 
                primeAudio();
                if (isTimerRunning || isTimerPreparing) {
                  setIsTimerRunning(false);
                  setIsTimerPreparing(false);
                } else {
                  setTimerPrepareTime(10);
                  setIsTimerPreparing(true);
                }
              }}
              style={{ 
                width: "120px", 
                height: "120px", 
                borderRadius: "50%", 
                background: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "var(--accent)", 
                color: (isTimerPreparing && timerPrepareTime <= 3) ? "var(--accent)" : "black", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                border: "none", 
                cursor: "pointer", 
                boxShadow: (isTimerPreparing && timerPrepareTime <= 3) ? "none" : "0 0 40px rgba(218,255,0,0.3)",
                transition: "all 0.2s ease",
                zIndex: 10
              }}
            >
              {isTimerRunning || isTimerPreparing ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "6px" }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>

            <div style={{ width: "80px", display: "flex", justifyContent: "center" }}>
              {(isTimerRunning || isTimerPreparing || (timerMode === 'stopwatch' && timerSeconds > 0) || (timerMode === 'countdown' && timerSeconds !== initialTimerSeconds) || (timerMode === 'tabata' && (currentTabataRound > 1 || tabataPhase !== 'work' || timerSeconds !== 20))) && (
                <button 
                  onClick={() => { 
                    setIsTimerRunning(false); 
                    setIsTimerPreparing(false); 
                    setTimerSeconds(initialTimerSeconds);
                    if (timerMode === 'tabata') setCurrentTabataRound(1);
                  }}
                  style={{ 
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "50%", 
                    border: (isTimerPreparing && timerPrepareTime <= 3) ? "1px solid rgba(0,0,0,0.2)" : "1px solid rgba(255,255,255,0.1)", 
                    background: (isTimerPreparing && timerPrepareTime <= 3) ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)", 
                    color: (isTimerPreparing && timerPrepareTime <= 3) ? "black" : "white", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Time Ritual Modal - PERSISTENT SLIDE SUPPORT */}
      <div 
        onClick={() => setIsTimeSheetOpen(false)}
        style={{ 
          position: "fixed", 
          inset: 0, 
          zIndex: 1999, 
          background: "rgba(0,0,0,0.8)", 
          backdropFilter: "blur(5px)",
          visibility: isTimeSheetOpen ? "visible" : "hidden",
          opacity: isTimeSheetOpen ? 1 : 0,
          transition: "all 0.4s ease"
        }} 
      />
      <div style={{ 
        position: "fixed", 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: "85vh", 
        background: "#111", 
        borderTop: "1px solid rgba(255,255,255,0.1)", 
        borderTopLeftRadius: "3rem", 
        borderTopRightRadius: "3rem", 
        zIndex: 2000, 
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "1.2rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
        transform: isTimeSheetOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: "transform"
      }}>
        <button 
          onClick={() => setIsTimeSheetOpen(false)}
          style={{
            position: "absolute",
            top: "calc(2.5rem + 20px)",
            right: "2rem",
            background: "none", 
            border: "none", 
            color: "white", 
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
            zIndex: 10
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <header style={{


          display: "flex",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.02em" }}>SESSION PARAMETERS</h2>
            <span style={{ fontSize: "0.6rem", opacity: 0.7, letterSpacing: "0.1em", fontWeight: "900" }}>RITUAL CONFIG</span>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }} className="no-scrollbar">
          <section>
              <h4 style={{ fontSize: "1rem", textTransform: "uppercase", color: "white", opacity: 0.8, letterSpacing: "0.2em", marginBottom: "1rem" }}>Session Duration (MIN)</h4>
              <div 
                style={{ 
                  display: "flex", 
                  gap: "0", 
                  overflowX: "auto", 
                  scrollSnapType: "x mandatory",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "999px",
                  padding: "1rem 0"
                }} 
                className="no-scrollbar"
              >
                {Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map(t => (
                  <button 
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    style={{ 
                      flex: "0 0 80px",
                      scrollSnapAlign: "center",
                      height: "80px", 
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "none",
                      color: selectedTime === t ? "var(--accent)" : "white",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <span style={{ 
                      fontSize: selectedTime === t ? "2.5rem" : "1.2rem", 
                      fontWeight: "900",
                      lineHeight: 1
                    }}>
                      {t}
                    </span>
                    <div style={{ 
                      width: "2px", 
                      height: selectedTime === t ? "12px" : "6px", 
                      background: selectedTime === t ? "var(--accent)" : "rgba(255,255,255,0.4)",
                      marginTop: "0.5rem"
                    }} />
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h4 style={{ fontSize: "1rem", textTransform: "uppercase", color: "white", opacity: 0.8, letterSpacing: "0.2em", marginBottom: "1rem" }}>Work Intensity (SEC)</h4>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                background: "rgba(255,255,255,0.03)", 
                borderRadius: "999px", 
                padding: "0.4rem" 
              }}>
                <button 
                  onClick={() => setGlobalDuration(Math.max(15, globalDuration - 15))}
                  style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", color: "white", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: "300" }}
                >
                  −
                </button>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "900", color: "white" }}>{globalDuration}</span>
                </div>
                <button 
                  onClick={() => setGlobalDuration(Math.min(180, globalDuration + 15))}
                  style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(217,255,0,0.1)", color: "var(--accent)", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: "300" }}
                >
                  +
                </button>
              </div>
            </section>

            <section>
              <h4 style={{ fontSize: "1rem", textTransform: "uppercase", color: "white", opacity: 0.8, letterSpacing: "0.2em", marginBottom: "1rem" }}>Recovery Window (SEC)</h4>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                background: "rgba(255,255,255,0.03)", 
                borderRadius: "999px", 
                padding: "0.4rem" 
              }}>
                <button 
                  onClick={() => setBreakTime(Math.max(0, breakTime - 5))}
                  style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", color: "white", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: "300" }}
                >
                  −
                </button>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "2rem", fontWeight: "900", color: "white" }}>{breakTime}</span>
                </div>
                <button 
                  onClick={() => setBreakTime(Math.min(60, breakTime + 5))}
                  style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(217,255,0,0.1)", color: "var(--accent)", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: "300" }}
                >
                  +
                </button>
              </div>
            </section>

            <button 
              className="button button-shiny" 
              onClick={() => {
                setSession(prev => prev.map(ex => ({ ...ex, duration: globalDuration })));
                setIsTimeSheetOpen(false);
              }}
              style={{ 
                marginTop: "3.5rem", 
                height: "70px", 
                width: "100%",
                borderRadius: "999px",
                fontSize: "1.2rem",
                letterSpacing: "0.2em",
                fontWeight: "900"
              }}
            >
              CONFIRM
            </button>
        </div>
      </div>
      {/* Manifesto Management Ritual */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#050505",
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
        color: "white",
        visibility: isFavoritesOpen ? "visible" : "hidden",
        transform: isFavoritesOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s",
        willChange: "transform"
      }}>
        <button 
          onClick={() => setIsFavoritesOpen(false)}
          style={{
            position: "absolute",
            top: "calc(2.5rem + 20px)",
            right: "2rem",
            background: "none", 
            border: "none", 
            color: "white", 
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
            zIndex: 10
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
          <header style={{
            padding: "2.2rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            position: "relative"
          }}>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.02em" }}>FAVOURITE MOVEMENTS</h2>
              <span style={{ fontSize: "0.6rem", opacity: 0.5, letterSpacing: "0.1em", fontWeight: "900" }}>{favorites.length} / 10 PERSONAL MANIFESTO</span>
            </div>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }} className="no-scrollbar">
            {favorites.length === 0 ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, textAlign: "center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <p style={{ marginTop: "1rem", fontSize: "0.8rem", fontWeight: "900" }}>NO FAVORITES YET</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[...exercisesData.warmups, ...exercisesData.exercises, ...exercisesData.cooldowns]
                  .filter(ex => favorites.includes(ex.name))
                  .map((ex, i) => (
                    <div key={ex.id} style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "1.5rem",
                      padding: "1.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "var(--accent)", opacity: 0.6 }}>{ex.id.startsWith('w') ? 'WARMUP' : ex.id.startsWith('c') ? 'COOLDOWN' : (ex as any).bodyArea || 'EXERCISE'}</span>
                        <h3 style={{ fontSize: "1.2rem", fontWeight: "900" }}>{ex.name}</h3>
                      </div>
                      <button 
                        onClick={() => toggleFavorite(ex.name)}
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "white",
                          border: "none",
                          color: "black",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <footer style={{ padding: "0 1.5rem 4rem" }}>
            <button 
              onClick={() => setIsFavoritesOpen(false)}
              className="button button-shiny"
              style={{ width: "100%", height: "70px", borderRadius: "999px", fontWeight: "900", letterSpacing: "0.2em", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              SAVE
            </button>
          </footer>
      </div>


      {/* Weight Tracking Ritual - PERSISTENT SLIDE SUPPORT */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#050505",
        zIndex: 3000,
        padding: "1.2rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
        visibility: isWeightOpen ? "visible" : "hidden",
        transform: isWeightOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s",
        willChange: "transform"
      }}>
        <button 
          onClick={() => setIsWeightOpen(false)} 
          style={{ 
            position: "absolute",
            top: "calc(2.5rem + 20px)",
            right: "2rem",
            background: "none", 
            border: "none", 
            color: "white", 
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
            zIndex: 10
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <header style={{
          padding: "2.2rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.02em" }}>WEIGHT TRACKER</h2>
            <span style={{ fontSize: "0.6rem", opacity: 0.7, letterSpacing: "0.1em", fontWeight: "900" }}>PROGRESS RITUAL</span>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {/* Graph Section */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "2rem", padding: "1.5rem", marginBottom: "2rem", minHeight: "200px", display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ fontSize: "0.7rem", opacity: 0.6, fontWeight: "900", letterSpacing: "0.1em", marginBottom: "1rem" }}>PROGRESS GRAPH</h3>
            <div style={{ flex: 1, position: "relative", minHeight: "120px" }}>
              {weights.length < 2 ? (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.4, fontSize: "0.7rem" }}>NEED AT LEAST 2 ENTRIES FOR GRAPH</div>
              ) : (
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                  <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={weights.map((w, i) => {
                      const x = (i / (weights.length - 1)) * 100;
                      const minW = Math.min(...weights.map(v => v.value)) - 2;
                      const maxW = Math.max(...weights.map(v => v.value)) + 2;
                      const y = 100 - ((w.value - minW) / (maxW - minW)) * 100;
                      return `${x},${y}`;
                    }).join(" ")}
                  />
                  {weights.map((w, i) => {
                    const x = (i / (weights.length - 1)) * 100;
                    const minW = Math.min(...weights.map(v => v.value)) - 2;
                    const maxW = Math.max(...weights.map(v => v.value)) + 2;
                    const y = 100 - ((w.value - minW) / (maxW - minW)) * 100;
                    return <circle key={i} cx={x} cy={y} r="2" fill="white" />;
                  })}
                </svg>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.6rem", fontWeight: "900", opacity: 0.5 }}>START</span>
              <span style={{ fontSize: "1rem", fontWeight: "900", color: "var(--accent)" }}>{weights.length > 0 ? `${weights[weights.length - 1].value} KG` : "--"}</span>
              <span style={{ fontSize: "0.6rem", fontWeight: "900", opacity: 0.5 }}>NOW</span>
            </div>
          </div>

          {/* Input Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input 
                type="text" 
                inputMode="decimal"
                placeholder="00.0" 
                id="weight-input"
                style={{ flex: 1, minWidth: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.2rem", color: "white", padding: "1rem", outline: "none", fontSize: "1.2rem", fontWeight: "900" }}
              />
              <input 
                type="date" 
                id="weight-date"
                defaultValue={new Date().toISOString().split('T')[0]}
                style={{ flex: 1.5, minWidth: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.2rem", color: "white", padding: "1rem", outline: "none", fontSize: "0.8rem", fontWeight: "900" }}
              />
            </div>
            <button 
              onClick={() => {
                const valInput = document.getElementById('weight-input') as HTMLInputElement;
                const dateInput = document.getElementById('weight-date') as HTMLInputElement;
                const val = parseFloat(valInput.value.replace(',', '.'));
                const date = dateInput.value;
                if (!isNaN(val)) {
                  setWeights(prev => [...prev, { date, value: val }].sort((a,b) => a.date.localeCompare(b.date)));
                  valInput.value = "";
                }
              }}
              style={{ width: "100%", height: "54px", borderRadius: "1.2rem", background: "var(--accent)", color: "black", border: "none", fontSize: "0.7rem", fontWeight: "900", letterSpacing: "0.1em", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              + RECORD WEIGHT CHECKPOINT
            </button>
          </div>

          {/* List Section */}
          <div>
            <h3 style={{ fontSize: "0.7rem", opacity: 0.6, fontWeight: "900", letterSpacing: "0.1em", marginBottom: "1rem" }}>LEDGER</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[...weights].reverse().map((w, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)", padding: "1.2rem 1.5rem", borderRadius: "1.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "900" }}>{w.value} <span style={{ opacity: 0.5, fontSize: "0.7rem" }}>KG</span></span>
                    <span style={{ fontSize: "0.6rem", opacity: 0.7, fontWeight: "900", textTransform: "uppercase" }}>{w.date}</span>
                  </div>
                  <button 
                    onClick={() => setWeights(prev => prev.filter((_, idx) => (prev.length - 1 - i) !== idx))}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Ritual Archive (UI Parity with Favourites) */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#050505",
        zIndex: 3000,
        padding: "1.2rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
        visibility: isLibraryOpen ? "visible" : "hidden",
        transform: isLibraryOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s",
        willChange: "transform"
      }}>
        <button 
          onClick={() => setIsLibraryOpen(false)}
          style={{
            position: "absolute",
            top: "calc(2.5rem + 20px)",
            right: "2rem",
            background: "none", 
            border: "none", 
            color: "white", 
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
            zIndex: 10
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
          <header style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "0.15em", color: "white", margin: 0 }}>YOUR WORKOUT</h2>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }} className="no-scrollbar">
            {hasHydrated && (() => {
              if (savedRituals.length === 0) {
                return (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, textAlign: "center" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <p style={{ marginTop: "1rem", fontSize: "0.8rem", fontWeight: "900" }}>NO SAVED WORKOUTS</p>
                  </div>
                );
              }
              return savedRituals.map((workout: any, idx: number) => (
                <div 
                  key={workout.id || idx}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    padding: "2rem 1.5rem",
                    borderRadius: "0",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)"
                  }}
                >
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => renameRitual(idx)}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "900", color: "var(--accent)", opacity: 0.6, letterSpacing: "0.2em", marginBottom: "0.5rem" }}>
                      {workout.name ? workout.date?.toUpperCase() : 'HISTORICAL RITUAL'}
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "white", marginBottom: "0.4rem", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      {workout.name || workout.date?.toUpperCase() || 'UNTITLED'}
                    </div>
                    <div style={{ fontSize: "0.8rem", fontWeight: "700", opacity: 0.4, letterSpacing: "0.05em" }}>
                      {workout.exercises.length} MOVEMENTS • {workout.duration} MIN
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
                    <button 
                      onClick={() => renameRitual(idx)}
                      style={{ 
                        background: "rgba(255,255,255,0.05)", 
                        border: "1px solid rgba(255,255,255,0.1)", 
                        color: "white", 
                        width: "50px", 
                        height: "50px", 
                        borderRadius: "50%", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        const next = savedRituals.filter((_: any, i: number) => i !== idx);
                        localStorage.setItem('xout_saved_workouts', JSON.stringify(next));
                        setSavedRituals(next);
                      }}
                      style={{ background: "rgba(255,0,0,0.1)", border: "none", color: "#ff4444", width: "50px", height: "50px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        primeAudio();
                        if (workout.duration) setSelectedTime(workout.duration);
                        setSelectionMode('manual');
                        // Load the ritual exactly as saved, bypassing the auto-sync favorites injection
                        setIsRitualActive(true);
                        setManualSession(workout.exercises);
                        setSession(workout.exercises);
                        setIsLibraryOpen(false);
                        setIsOptionsOpen(false);
                        setIsTrayExpanded(true);
                      }}
                      style={{
                        flex: 1,
                        background: "var(--accent)",
                        color: "black",
                        border: "none",
                        height: "50px",
                        borderRadius: "100px",
                        fontSize: "0.8rem",
                        fontWeight: "900",
                        cursor: "pointer",
                        letterSpacing: "0.1em"
                      }}
                    >
                      GET READY
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
      </div>

      {toastMessage && (
        <div className="toast">
          {toastMessage.toUpperCase().includes("FAVORITES") || toastMessage.toUpperCase().includes("SAVED") || toastMessage.toUpperCase().includes("LIBRARY") ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          )}
          {toastMessage}
        </div>
      )}
      {/* Area Selection Modal (Surprise Mode) */}
      {/* Area Selection Modal (Surprise Mode Filter) - PERSISTENT SLIDE SUPPORT */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#050505",
        zIndex: 6000,
        padding: "1.2rem 2rem 0",
        display: "flex",
        flexDirection: "column",
        gap: "2.5rem",
        visibility: isAreaModalOpen ? "visible" : "hidden",
        transform: isAreaModalOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.5s",
        willChange: "transform"
      }}>
        <button 
          onClick={() => setIsAreaModalOpen(false)}
          style={{
            position: "absolute",
            top: "calc(2.5rem + 20px)",
            right: "2rem",
            background: "none", 
            border: "none", 
            color: "white", 
            cursor: "pointer",
            opacity: 0.5,
            transition: "opacity 0.2s",
            zIndex: 10
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <header style={{
          padding: "2.2rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center"
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "900", letterSpacing: "-0.02em" }}>TARGET AREA</h2>
            <span style={{ fontSize: "0.6rem", opacity: 0.7, letterSpacing: "0.1em", fontWeight: "900" }}>SURPRISE FILTER</span>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }} className="no-scrollbar">
          {/* Specialized Mode Toggles */}
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2.5rem" }}>
            {/* Surf Mode */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button 
                onClick={() => {
                  setIsSurfMode(!isSurfMode);
                  if (!isSurfMode) setIsYogaMode(false);
                }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: isSurfMode ? "#01ebff" : "rgba(255,255,255,0.05)",
                  border: "none",
                  color: isSurfMode ? "black" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  boxShadow: isSurfMode ? "0 10px 30px rgba(1, 235, 255, 0.4)" : "none",
                  transform: isSurfMode ? "scale(1.05)" : "scale(1)"
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 17c.6.5 1.2 1 2.5 1 2.7 0 4.5-2 4.5-2s1.8 2 4.5 2 4.5-2 4.5-2 1.8 2 4.5 2 1.9-.5 2.5-1M2 12c.6.5 1.2 1 2.5 1 2.7 0 4.5-2 4.5-2s1.8 2 4.5 2 4.5-2 4.5-2 1.8 2 4.5 2 1.9-.5 2.5-1M2 7c2.7 0 4.5 2 4.5 2s1.8-2 4.5-2 4.5 2 4.5 2 1.8-2 4.5-2 4.5 2 4.5 2" />
                </svg>
              </button>
              <span style={{ marginTop: "0.8rem", fontSize: "0.6rem", fontWeight: "900", color: isSurfMode ? "#01ebff" : "white", letterSpacing: "0.2em", opacity: isSurfMode ? 1 : 0.4 }}>SURF</span>
            </div>

            {/* Yoga Mode */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <button 
                onClick={() => {
                  setIsYogaMode(!isYogaMode);
                  if (!isYogaMode) setIsSurfMode(false);
                }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: isYogaMode ? "#e000ff" : "rgba(255,255,255,0.05)",
                  border: "none",
                  color: isYogaMode ? "white" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  boxShadow: isYogaMode ? "0 10px 30px rgba(224, 0, 255, 0.4)" : "none",
                  transform: isYogaMode ? "scale(1.05)" : "scale(1)"
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 10c0-4.418 3.582-8 8-8v8h-8zM12 10c0 4.418-3.582 8-8 8V10h8zM12 10c4.418 0 8 3.582 8 8h-8V10zM12 10c-4.418 0-8-3.582-8-8h8v10z" />
                </svg>
              </button>
              <span style={{ marginTop: "0.8rem", fontSize: "0.6rem", fontWeight: "900", color: isYogaMode ? "#e000ff" : "white", letterSpacing: "0.2em", opacity: isYogaMode ? 1 : 0.4 }}>RECOVERY</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {BODY_AREAS.map(area => {
              const isSelected = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  onClick={() => {
                    setSelectedAreas(prev => 
                      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
                    );
                  }}
                  style={{
                    background: isSelected ? "var(--accent)" : "rgba(255,255,255,0.03)",
                    borderRadius: "1.5rem",
                    padding: "1.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: isSelected ? "none" : "1px solid rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isSelected ? "scale(1.02)" : "scale(1)"
                  }}
                >
                  <span style={{ 
                    fontSize: "1.1rem", 
                    fontWeight: "900", 
                    color: isSelected ? "black" : "white",
                    letterSpacing: "0.05em" 
                  }}>
                    {area.toUpperCase()}
                  </span>
                  {isSelected && (
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <footer style={{ 
          padding: "1.5rem 2rem 3rem", 
          background: "linear-gradient(to top, #050505 80%, transparent)",
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}>
          <button 
            onClick={() => setIsAreaModalOpen(false)}
            className="button button-shiny"
            style={{ 
              width: "100%", 
              height: "70px", 
              borderRadius: "999px", 
              fontWeight: "900", 
              letterSpacing: "0.2em",
              fontSize: "1.1rem"
            }}
          >
            CONFIRM
          </button>
        </footer>
      </div>
    </>
  );
}
