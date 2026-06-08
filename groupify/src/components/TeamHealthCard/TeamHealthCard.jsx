import { useState } from 'react';
import * as api from '../../services/api';

export default function TeamHealthCard({ project, onUpdate }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const health = project?.team_health;

  async function handleAnalyze() {
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.analyzeTeamHealth(project._id || project.id);
      if (onUpdate) onUpdate(res.team_health);
    } catch (err) {
      setError('AI Analysis failed. Try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (!project) return null;

  if (!health && !analyzing) {
    return (
      <div className="cmd-card ai-health-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem' }}>
        <div className="stat-icon ai-icon" style={{ width: '60px', height: '60px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </div>
        <h2 style={{ margin: 0 }}>AI Team Predictor</h2>
        <p style={{ color: 'var(--text-muted)' }}>Generate an AI health report to uncover missing skills and project risks.</p>
        <button className="btn-primary" onClick={handleAnalyze}>✨ Run AI Analysis</button>
        {error && <p style={{ color: '#ef4444' }}>{error}</p>}
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="cmd-card ai-health-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
        <h2>Gemini is analyzing...</h2>
        <p>Evaluating skills, roles, and project requirements.</p>
      </div>
    );
  }

  return (
    <div className="cmd-card ai-health-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>AI Team Health Report</h2>
        <button className="btn-secondary btn-small" onClick={handleAnalyze}>🔄 Recalculate</button>
      </div>
      
      {/* SCORES SECTION */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', borderLeft: `4px solid ${health.score >= 80 ? '#10b981' : '#f59e0b'}` }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Health Score</p>
          <h3 style={{ fontSize: '2rem', margin: 0, color: health.score >= 80 ? '#10b981' : '#f59e0b' }}>{health.score}%</h3>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', borderLeft: `4px solid ${health.probability >= 80 ? '#10b981' : '#f59e0b'}` }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Success Prob.</p>
          <h3 style={{ fontSize: '2rem', margin: 0, color: health.probability >= 80 ? '#10b981' : '#f59e0b' }}>{health.probability}%</h3>
        </div>
      </div>

      {/* DYNAMIC ROLES SECTION */}
      <div>
        <h4 style={{ 
          color: health.missing_roles?.length > 0 ? '#ef4444' : '#10b981', 
          marginBottom: '0.5rem' 
        }}>
          {health.missing_roles?.length > 0 ? '⚠️ Critical Missing Roles' : '✅ Team Roles'}
        </h4>
        <div className="dash-chips small-chips">
          {health.missing_roles?.length > 0 
            ? health.missing_roles.map(r => <span key={r} className="dash-chip" style={{ borderColor: '#ef4444', color: '#ef4444' }}>{r}</span>) 
            : <span style={{ color: '#10b981', fontWeight: '500' }}>All core roles filled.</span>}
        </div>
      </div>

      {/* DYNAMIC SKILLS SECTION */}
      <div>
        <h4 style={{ 
          color: health.missing_skills?.length > 0 ? '#f59e0b' : '#10b981', 
          marginBottom: '0.5rem' 
        }}>
          {health.missing_skills?.length > 0 ? '🎯 Skill Gaps' : '✅ Skill Coverage'}
        </h4>
        <div className="dash-chips small-chips">
          {health.missing_skills?.length > 0 
            ? health.missing_skills.map(s => <span key={s} className="dash-chip" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>{s}</span>) 
            : <span style={{ color: '#10b981', fontWeight: '500' }}>All required skills covered.</span>}
        </div>
      </div>

      {/* AI RECOMMENDATIONS (SCROLLABLE) */}
      <div style={{ background: 'var(--bg-surface-dark)', padding: '1rem', borderRadius: '8px' }}>
        <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>💡 AI Recommendations</h4>
        
        <div className="ai-recommendations-scroll">
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
            {health.recommendations?.map((rec, i) => (
              <li key={i} style={{ marginBottom: '0.8rem', lineHeight: '1.4' }}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}