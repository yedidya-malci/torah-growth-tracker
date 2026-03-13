import React, { useState, useEffect } from 'react';
import type { StudyTrack } from './types';
import { calculatePace, getHebrewDateInfo, resolveHebrewNameByDate } from './utils/hebcal';
import { Plus, Trash2, Calendar, BookOpen, Repeat, Info, Download, AlertCircle, RefreshCw, Monitor, Smartphone, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const App: React.FC = () => {
  const [tracks, setTracks] = useState<StudyTrack[]>(() => {
    const saved = localStorage.getItem('torah-tracks');
    return saved ? JSON.parse(saved).map((t: StudyTrack) => ({ ...t, deadline: new Date(t.deadline), createdAt: new Date(t.createdAt) })) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newTrack, setNewTrack] = useState<Partial<StudyTrack>>({
    name: '',
    unitType: 'Perakim',
    totalUnits: 0,
    alreadyLearned: 0,
    repetitions: 1,
    deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  });

  const [dateInput, setDateInput] = useState('');
  const [showDownloadPage, setShowDownloadPage] = useState(false);

  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    localStorage.setItem('torah-tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    // Electron Update Listeners
    if ((window as any).electronAPI) {
      const api = (window as any).electronAPI;
      
      api.on('update-available', (info: any) => {
        setUpdateStatus('available');
        setUpdateInfo(info);
      });
      
      api.on('update-not-available', () => {
        setUpdateStatus('idle');
      });

      api.on('download-progress', (progress: any) => {
        setDownloadProgress(progress.percent);
      });

      api.on('update-downloaded', () => {
        setUpdateStatus('downloaded');
      });

      api.on('update-error', () => {
        setUpdateStatus('error');
      });
    }
  }, []);

  const checkForUpdates = async () => {
    if (!(window as any).electronAPI) return;
    setUpdateStatus('checking');
    await (window as any).electronAPI.invoke('check-for-updates');
  };

  const startDownload = async () => {
    setUpdateStatus('downloading');
    await (window as any).electronAPI.invoke('start-download');
  };

  const installUpdate = () => {
    (window as any).electronAPI.invoke('quit-and-install');
  };

  const addTrack = () => {
    if (!newTrack.name || !newTrack.totalUnits) return;
    
    const track: StudyTrack = {
      id: crypto.randomUUID(),
      name: newTrack.name || '',
      unitType: newTrack.unitType || 'Perakim',
      totalUnits: Number(newTrack.totalUnits),
      alreadyLearned: Number(newTrack.alreadyLearned),
      repetitions: Number(newTrack.repetitions),
      deadline: newTrack.deadline || new Date(),
      createdAt: new Date()
    };
    
    setTracks([...tracks, track]);
    setIsAdding(false);
    setNewTrack({
      name: '',
      unitType: 'Perakim',
      totalUnits: 0,
      alreadyLearned: 0,
      repetitions: 1,
      deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    });
    setDateInput('');
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const updateTrack = (id: string, alreadyLearned: number) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, alreadyLearned } : t));
  };

  const handleDateInput = (val: string) => {
    setDateInput(val);
    const resolved = resolveHebrewNameByDate(val);
    if (resolved) {
      setNewTrack({ ...newTrack, deadline: resolved });
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="container">
            <div className="header-meta">
              <h1 className="title" onClick={() => setShowDownloadPage(false)} style={{ cursor: 'pointer' }}>מעקב צמיחה בתורה</h1>
              <p className="subtitle">תכנון וניהול יעדי הלימוד שלך</p>
            </div>
            
            <div className="header-actions">
              <button className="btn-download-link" onClick={() => setShowDownloadPage(true)}>
                <Download size={16} />
                <span>הורדה למכשירים</span>
              </button>
              {updateStatus === 'idle' && (
                <button className="btn-update-check" onClick={checkForUpdates} data-tooltip="בדוק אם יש עדכון חדש">
                  <RefreshCw size={16} />
                  <span>בדוק עדכון</span>
                </button>
              )}
              {updateStatus === 'checking' && <span className="update-msg">בודק...</span>}
              {updateStatus === 'available' && (
                <div className="update-box available">
                  <div className="update-info">
                    <Download size={18} />
                    <span>קיים עדכון גרסה ({updateInfo?.version})</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={startDownload}>הורד כעת</button>
                </div>
              )}
              {updateStatus === 'downloading' && (
                <div className="update-box downloading">
                  <span>מוריד: {downloadProgress.toFixed(0)}%</span>
                  <div className="mini-progress-bar"><div className="fill" style={{ width: `${downloadProgress}%` }}></div></div>
                </div>
              )}
              {updateStatus === 'downloaded' && (
                <div className="update-box downloaded">
                  <span>ההורדה הושלמה!</span>
                  <button className="btn btn-accent btn-sm" onClick={installUpdate}>עדכן והפעל מחדש</button>
                </div>
              )}
              {updateStatus === 'error' && (
                <div className="update-box error">
                  <AlertCircle size={18} />
                  <span>שגיאה בבדיקת עדכון</span>
                  <button className="btn-icon" onClick={() => setUpdateStatus('idle')}><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></button>
                </div>
              )}
            </div>
        </div>
      </header>

      <main className="container main">
        {showDownloadPage ? (
          <DownloadPage onBack={() => setShowDownloadPage(false)} />
        ) : (
          <>
            <div className="actions-bar">
              <button 
                className="btn btn-primary" 
                onClick={() => setIsAdding(true)}
                data-tooltip="הוסף מסלול לימוד חדש"
              >
                <Plus size={20} />
                <span>הוסף מסלול</span>
              </button>
            </div>

            <section className="reminders-section">
              {tracks.length > 0 && (
                <div className="card reminders-card">
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Info size={20} color="var(--accent)" />
                      <h3>מה לומדים היום?</h3>
                    </div>
                  </div>
                  <div className="reminders-list">
                    {tracks.map((track: StudyTrack) => {
                      const pace = calculatePace(track.totalUnits, track.alreadyLearned, track.repetitions, track.deadline);
                      const unitLabel = track.unitType === 'Masechtot' ? 'מסכתות' : track.unitType === 'Perakim' ? 'פרקים' : 'דפים';
                      return (
                        <div key={track.id} className="reminder-item">
                          <span className="reminder-name">{track.name}:</span>
                          <span className="reminder-text">
                            עליך ללמוד <strong>{pace} {unitLabel}</strong> היום כדי לעמוד ביעד.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard">
              <AnimatePresence>
                {tracks.length === 0 && !isAdding && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state"
                  >
                    <BookOpen size={64} />
                    <p>אין מסלולי לימוד פעילים. התחל להוסיף אחד!</p>
                  </motion.div>
                )}

                {isAdding && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="card track-form"
                  >
                    <h3>מסלול חדש</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>שם המסלול</label>
                        <input 
                          type="text" 
                          placeholder="לדוגמה: גמרא קידושין" 
                          value={newTrack.name}
                          onChange={e => setNewTrack({...newTrack, name: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>סוג יחידה</label>
                        <select 
                          value={newTrack.unitType}
                          onChange={e => setNewTrack({...newTrack, unitType: e.target.value as any})}
                        >
                          <option value="Masechtot">מסכתות</option>
                          <option value="Perakim">פרקים</option>
                          <option value="Blatt">דפים</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>סה"כ יחידות</label>
                        <input 
                          type="number" 
                          value={newTrack.totalUnits || ''} 
                          onChange={e => setNewTrack({...newTrack, totalUnits: Number(e.target.value)})}
                        />
                      </div>
                      <div className="form-group">
                        <label>כבר נלמד</label>
                        <input 
                          type="number" 
                          value={newTrack.alreadyLearned || ''} 
                          onChange={e => setNewTrack({...newTrack, alreadyLearned: Number(e.target.value)})}
                        />
                      </div>
                      <div className="form-group">
                        <label>מספר חזרות</label>
                        <input 
                          type="number" 
                          value={newTrack.repetitions || 1} 
                          onChange={e => setNewTrack({...newTrack, repetitions: Number(e.target.value)})}
                        />
                      </div>
                      <div className="form-group">
                        <label>תאריך יעד (עברי או לועזי)</label>
                        <input 
                          type="text" 
                          placeholder="לדוגמה: שבועות או 2024-12-31" 
                          value={dateInput}
                          onChange={e => handleDateInput(e.target.value)}
                        />
                        {newTrack.deadline && (
                          <span className="deadline-preview">
                            {getHebrewDateInfo(newTrack.deadline).displayName} ({newTrack.deadline.toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="form-actions">
                      <button className="btn btn-primary" onClick={addTrack}>שמור</button>
                      <button className="btn btn-secondary" onClick={() => setIsAdding(false)}>ביטול</button>
                    </div>
                  </motion.div>
                )}

                <div className="tracks-grid">
                  {tracks.map((track: StudyTrack) => (
                    <TrackCard 
                      key={track.id} 
                      track={track} 
                      onUpdate={updateTrack}
                      onRemove={() => removeTrack(track.id)} 
                    />
                  ))}
                </div>
              </AnimatePresence>
            </section>

            {tracks.length > 0 && <SummaryTable tracks={tracks} />}
          </>
        )}
      </main>
    </div>
  );
};

const TrackCard: React.FC<{ track: StudyTrack, onUpdate: (id: string, learned: number) => void, onRemove: () => void }> = ({ track, onUpdate, onRemove }) => {
  const pace = calculatePace(track.totalUnits, track.alreadyLearned, track.repetitions, track.deadline);
  const progressPercent = Math.min(100, (track.alreadyLearned / track.totalUnits) * 100);
  const dateInfo = getHebrewDateInfo(track.deadline);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card track-card"
    >
      <div className="card-header">
        <h4>{track.name}</h4>
        <button className="btn-icon" onClick={onRemove} data-tooltip="מחק מסלול">
          <Trash2 size={18} />
        </button>
      </div>
      <div className="card-body">
        <div className="progress-section">
          <div className="progress-bar-bg">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="progress-bar-fill"
            />
          </div>
          <div className="progress-row">
            <span className="progress-label">{progressPercent.toFixed(0)}% הושלם</span>
            <div className="progress-actions">
              <button 
                className="btn-tiny" 
                onClick={() => onUpdate(track.id, Math.max(0, track.alreadyLearned - 1))}
                disabled={track.alreadyLearned <= 0}
              >-</button>
              <span className="already-learned">{track.alreadyLearned} / {track.totalUnits}</span>
              <button 
                className="btn-tiny" 
                onClick={() => onUpdate(track.id, Math.min(track.totalUnits, track.alreadyLearned + 1))}
                disabled={track.alreadyLearned >= track.totalUnits}
              >+</button>
            </div>
          </div>
        </div>
        
        <div className="info-grid">
          <div className="info-item">
            <Calendar size={16} />
            <span>יעד: {dateInfo.displayName}</span>
          </div>
          <div className="info-item">
            <Repeat size={16} />
            <span>חזרות: {track.repetitions}</span>
          </div>
          <div className="info-item highlight">
            <BookOpen size={16} />
            <span>קצב יומי: {pace} {track.unitType === 'Masechtot' ? 'מסכתות' : track.unitType === 'Perakim' ? 'פרקים' : 'דפים'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryTable: React.FC<{ tracks: StudyTrack[] }> = ({ tracks }) => {
  return (
    <section className="summary-section">
      <h3 className="section-title">סיכום מסלולים</h3>
      <div className="table-container card">
        <table>
          <thead>
            <tr>
              <th>מסלול</th>
              <th>קצב יומי</th>
              <th>התקדמות</th>
              <th>תאריך סיום (עברי)</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track: StudyTrack) => {
              const pace = calculatePace(track.totalUnits, track.alreadyLearned, track.repetitions, track.deadline);
              const dateInfo = getHebrewDateInfo(track.deadline);
              return (
                <tr key={track.id}>
                  <td>{track.name}</td>
                  <td>{pace} {track.unitType}</td>
                  <td>{((track.alreadyLearned / track.totalUnits) * 100).toFixed(0)}%</td>
                  <td>{dateInfo.displayName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const DownloadPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="download-page"
    >
      <button className="btn-back" onClick={onBack}>
        <ChevronLeft size={20} />
        <span>חזרה למעקב</span>
      </button>

      <h2 className="page-title">הורדת האפליקציה למכשירים</h2>
      
      <div className="download-grid">
        <div className="card download-card">
          <Monitor size={48} color="var(--primary)" />
          <h3>גרסת מחשב (Windows)</h3>
          <p>הורד את הגרסה העדכנית ביותר למחשב האישי שלך.</p>
          <a 
            href="https://github.com/yedidya-malci/torah-growth-tracker/releases/latest" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <Download size={18} />
            <span>הורד למחשב (.zip)</span>
          </a>
          <ul className="guide-list">
            <li>חלץ את הקובץ לתיקייה קבועה</li>
            <li>הפעל את "Torah Growth Tracker.exe"</li>
            <li>המערכת תתריע אם יהיה עדכון חדש</li>
          </ul>
        </div>

        <div className="card download-card">
          <Smartphone size={48} color="var(--primary)" />
          <h3>גרסת טלפון (אייפון / אנדרואיד)</h3>
          <p>אין צורך בהורדת קובץ! פשוט הוסף למסך הבית.</p>
          <div className="qr-box">
             {/* Placeholder for QR code if needed, but text instructions are better for PWA */}
             <div className="url-badge">yedidya-malci.github.io/torah-growth-tracker</div>
          </div>
          <ul className="guide-list">
            <li><strong>באייפון (Safari):</strong> לחץ על "שיתוף" {'>'} "הוסף למסך הבית".</li>
            <li><strong>באנדרואיד (Chrome):</strong> לחץ על שלוש הנקודות {'>'} "התקן אפליקציה".</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default App;
