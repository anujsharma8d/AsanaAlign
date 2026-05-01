import React, { useState } from 'react';
import './Achievements.css';

const CATEGORIES = [
  { id: 'all',         label: 'All'         },
  { id: 'milestone',   label: 'Milestones'  },
  { id: 'streak',      label: 'Streaks'     },
  { id: 'time',        label: 'Time'        },
  { id: 'variety',     label: 'Variety'     },
  { id: 'mastery',     label: 'Mastery'     },
  { id: 'consistency', label: 'Consistency' },
  { id: 'special',     label: 'Special'     },
];

export default function Achievements({ achievements = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total    = achievements.length;

  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  // Unlocked first, then locked sorted by progress desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return b.percent - a.percent;
  });

  return (
    <div className="achievements-section">
      {/* Header */}
      <div className="achievements-header">
        <div className="achievements-title">
          <span className="achievements-trophy">🏆</span>
          <div>
            <h3>Achievements</h3>
            <p className="achievements-sub">{unlocked} / {total} unlocked</p>
          </div>
        </div>
        <div className="achievements-overall-bar">
          <div
            className="achievements-overall-fill"
            style={{ width: `${Math.round((unlocked / total) * 100)}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="achievements-filters">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`ach-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="achievements-grid">
        {sorted.map(ach => (
          <div
            key={ach.id}
            className={`ach-card ${ach.unlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="ach-icon">{ach.icon}</div>
            <div className="ach-body">
              <div className="ach-top">
                <span className="ach-title">{ach.title}</span>
                {ach.unlocked && <span className="ach-badge">✓</span>}
              </div>
              <p className="ach-desc">{ach.description}</p>
              {!ach.unlocked && (
                <div className="ach-progress-wrap">
                  <div className="ach-progress-bar">
                    <div
                      className="ach-progress-fill"
                      style={{ width: `${ach.percent}%` }}
                    />
                  </div>
                  <span className="ach-progress-text">
                    {ach.progress} / {ach.target}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
