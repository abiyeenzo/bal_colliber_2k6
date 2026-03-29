import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

type ThemeKey = 
  | 'Masquerade' 
  | 'Glam' 
  | 'Euphoria' 
  | 'Oscar Night' 
  | 'Monarch & Magnificence' 
  | 'Gatsby';

interface ThemeConfig {
  bg: string;
  text: string;
  primary: string;
  secondary: string;
  font: string;
  accent: string;
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  'Masquerade': {
    bg: '#1a052e',
    text: '#f3e8ff',
    primary: '#a855f7',
    secondary: '#2e1065',
    font: "'Cinzel', serif",
    accent: '#ffffff'
  },
  'Glam': {
    bg: '#ffffff',
    text: '#1a1a1a',
    primary: '#ff0066',
    secondary: '#fce7f3',
    font: "'Montserrat', sans-serif",
    accent: '#000000'
  },
  'Euphoria': {
    bg: '#000000',
    text: '#ffffff',
    primary: '#7000ff',
    secondary: '#1a0033',
    font: "'Montserrat', sans-serif",
    accent: '#00f0ff'
  },
  'Oscar Night': {
    bg: '#0a0a0a',
    text: '#ffffff',
    primary: '#d4af37',
    secondary: '#1a1a1a',
    font: "'Playfair Display', serif",
    accent: '#ff0000'
  },
  'Monarch & Magnificence': {
    bg: '#1a0505',
    text: '#fdf5e6',
    primary: '#d4af37',
    secondary: '#4a0404',
    font: "'Cinzel', serif",
    accent: '#ffffff'
  },
  'Gatsby': {
    bg: '#000000',
    text: '#d4af37',
    primary: '#d4af37',
    secondary: '#1a1a1a',
    font: "'Playfair Display', serif",
    accent: '#ffffff'
  }
};

function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('Gatsby');
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const savedVote = localStorage.getItem('bal_vote_2026_libermann');
    if (savedVote) setHasVoted(true);

    const fetchResults = async () => {
      try {
        const res = await fetch('/api/results');
        const data = await res.json();
        setVotes(data);
      } catch (e) {
        console.error("Failed to load real votes");
      }
    };
    fetchResults();
    const interval = setInterval(fetchResults, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (theme: ThemeKey) => {
    if (hasVoted || isVoting) return;
    
    setIsVoting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme })
      });
      
      if (res.ok) {
        localStorage.setItem('bal_vote_2026_libermann', 'true');
        setHasVoted(true);
        setCurrentTheme(theme);
        
        const dataRes = await fetch('/api/results');
        const data = await dataRes.json();
        setVotes(data);
      }
    } catch (e) {
      alert("Erreur lors du vote. Réessayez !");
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const sortedThemes = Object.entries(votes).sort(([, a], [, b]) => b - a);
  const winningTheme = sortedThemes.length > 0 && totalVotes > 0 ? sortedThemes[0][0] : null;

  const themeStyle = THEMES[currentTheme];

  return (
    <div className="app-container" style={{ 
      backgroundColor: themeStyle.bg, 
      color: themeStyle.text,
      fontFamily: themeStyle.font,
      '--primary': themeStyle.primary,
      '--secondary': themeStyle.secondary,
      '--accent': themeStyle.accent
    } as any}>
      
      <header className="hero">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Bal de Promo 2026
        </motion.h1>
        <motion.p className="subtitle">Collège Libermann</motion.p>
      </header>

      <main className="content">
        <section className="selection-area">
          <AnimatePresence mode="wait">
            {!hasVoted ? (
              <motion.div
                key="voting"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2>Votez pour le thème définitif</h2>
                <div className="theme-grid">
                  {(Object.keys(THEMES) as ThemeKey[]).map((theme) => (
                    <button
                      key={theme}
                      className={`theme-card ${currentTheme === theme ? 'active' : ''}`}
                      onClick={() => setCurrentTheme(theme)}
                      style={{ 
                        borderColor: currentTheme === theme ? themeStyle.primary : 'transparent',
                        backgroundColor: themeStyle.secondary
                      }}
                    >
                      {theme}
                    </button>
                  ))}
                </div>

                <button 
                  className="vote-btn"
                  disabled={isVoting}
                  onClick={() => handleVote(currentTheme)}
                  style={{ backgroundColor: themeStyle.primary, color: themeStyle.bg, opacity: isVoting ? 0.7 : 1 }}
                >
                  {isVoting ? "Enregistrement..." : `Confirmer le thème "${currentTheme}"`}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                className="results-container"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="success-badge" style={{ color: themeStyle.primary }}>
                  ✓ Votre vote est enregistré
                </div>
                <h3>Les tendances en direct</h3>
                <div className="stats">
                  {sortedThemes.map(([name, count]) => {
                    const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : "0.0";
                    const isWinner = name === winningTheme;
                    return (
                      <div key={name} className={`stat-row ${isWinner ? 'winner' : ''}`}>
                        <div className="stat-label">
                          <span>{isWinner ? `🏆 ${name}` : name}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="progress-bar-bg" style={{ backgroundColor: themeStyle.secondary }}>
                          <motion.div 
                            className="progress-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ 
                              backgroundColor: themeStyle.primary,
                              boxShadow: isWinner ? `0 0 15px ${themeStyle.primary}` : 'none'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="total-count">{totalVotes} voix récoltées</p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="footer">
        <a href="https://www.instagram.com/abiye_enzo" target="_blank" rel="noreferrer">
          Code par Abiye Enzo
        </a>
      </footer>
    </div>
  );
}

export default App;
