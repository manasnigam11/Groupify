import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../../services/api';
import '../CreateProject/ProjectForm.css';

const SKILL_OPTIONS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++',
  'React', 'Vue', 'Angular', 'Next.js', 'Svelte',
  'Node.js', 'FastAPI', 'Django', 'Express', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
  'TensorFlow', 'PyTorch', 'Scikit-Learn', 'LangChain', 'Gemini API',
  'Flutter', 'React Native', 'Swift', 'Kotlin',
  'Figma', 'Adobe XD', 'Tailwind CSS', 'Material UI',
  'Docker', 'Kubernetes', 'AWS', 'Google Cloud', 'Azure',
  'Git', 'CI/CD', 'GraphQL', 'REST APIs',
];

const ROLE_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full-Stack Developer',
  'AI/ML Engineer', 'UI/UX Designer', 'Mobile Developer',
  'Product Manager', 'Data Scientist', 'DevOps Engineer',
];

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [requiredRoles, setRequiredRoles] = useState([]);
  const [hackathonCategory, setHackathonCategory] = useState('');

  useEffect(() => {
    async function loadProject() {
      try {
        const proj = await api.getProject(id);
        setTitle(proj.title || '');
        setDescription(proj.description || '');
        setProblemStatement(proj.problem_statement || '');
        setRequiredSkills(proj.required_skills || []);
        setRequiredRoles(proj.required_roles || []);
        setHackathonCategory(proj.hackathon_category || '');
      } catch (err) {
        setError('Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  function toggleItem(arr, setter, item) {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  }

  function canSave() {
    return title.trim().length > 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.updateProject(id, {
        title,
        description,
        problem_statement: problemStatement,
        required_skills: requiredSkills,
        required_roles: requiredRoles,
        hackathon_category: hackathonCategory,
      });

      setSuccess('Project updated successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update project.');
      setSaving(false);
    }
  }
  
  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.deleteProject(id);
        navigate('/dashboard');
      } catch (err) {
        setError(err.message || 'Failed to delete project.');
      }
    }
  }

  if (loading) {
    return <div className="project-form-screen"><div className="auth-subtitle" style={{textAlign:'center', width:'100%', marginTop:'4rem'}}>Loading...</div></div>;
  }

  return (
    <div className="project-form-screen">
      <div className="project-form-container animate-fade-in-up">
        <h1 className="project-form-title">Edit Project</h1>
        <p className="project-form-subtitle">Update your project details and requirements</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success" style={{ color: '#10b981', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>{success}</div>}

        <form onSubmit={handleSave} className="project-form">
          <section className="form-section">
            <h2>Project Basics</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="pj-title">Project Title *</label>
              <input
                id="pj-title"
                type="text"
                className="form-input"
                placeholder="e.g. EcoTracker App"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pj-desc">Short Description</label>
              <textarea
                id="pj-desc"
                className="form-input form-textarea"
                placeholder="A one-sentence pitch..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={2000}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pj-problem">Problem Statement</label>
              <textarea
                id="pj-problem"
                className="form-input form-textarea"
                placeholder="What problem are you trying to solve?"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                rows={4}
                maxLength={1000}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Team Requirements</h2>
            <p className="section-desc">Select the skills and roles you need for this project. The AI matcher will use these to find compatible teammates.</p>
            
            <div className="form-group">
              <label className="form-label">
                Required Skills <span className="form-count">{requiredSkills.length} selected</span>
              </label>
              <div className="chip-grid">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={`chip ${requiredSkills.includes(skill) ? 'chip-active' : ''}`}
                    onClick={() => toggleItem(requiredSkills, setRequiredSkills, skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Required Roles <span className="form-count">{requiredRoles.length} selected</span>
              </label>
              <div className="chip-grid">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`chip ${requiredRoles.includes(role) ? 'chip-active' : ''}`}
                    onClick={() => toggleItem(requiredRoles, setRequiredRoles, role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Additional Info</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="pj-track">Hackathon Track/Category</label>
              <input
                id="pj-track"
                type="text"
                className="form-input"
                placeholder="e.g. AI for Good, FinTech..."
                value={hackathonCategory}
                onChange={(e) => setHackathonCategory(e.target.value)}
              />
            </div>
          </section>

          <div className="project-form-actions" style={{justifyContent: 'space-between'}}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleDelete}
              style={{color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)'}}
            >
              Delete Project
            </button>
            <div style={{display: 'flex', gap: '1rem'}}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!canSave() || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
