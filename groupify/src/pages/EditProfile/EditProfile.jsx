import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './EditProfile.css';

const ROLE_OPTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full-Stack Developer',
  'AI/ML Engineer', 'UI/UX Designer', 'Mobile Developer',
  'Product Manager', 'Data Scientist', 'DevOps Engineer',
];

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

const INTEREST_OPTIONS = [
  'AI/ML', 'HealthTech', 'FinTech', 'EdTech', 'CleanTech',
  'Gaming', 'Social Impact', 'Web3', 'DevTools', 'Cybersecurity',
  'IoT', 'AR/VR', 'E-Commerce', 'Open Source', 'Accessibility',
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Required Profile Info
  const [name, setName] = useState('');
  const [rolePreference, setRolePreference] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [interests, setInterests] = useState([]);

  // Optional Profile Info
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.profile.name || '');
      setRolePreference(user.preferences.role_preference || '');
      setSelectedSkills(user.skills.technical || []);
      setInterests(user.preferences.hackathon_interests || []);
      setUniversity(user.profile.university || '');
      setYear(user.profile.year || '');
      setBio(user.profile.bio || '');
      setGithub(user.profile.github_url || '');
      setLinkedin(user.profile.linkedin_url || '');
    }
  }, [user]);

  function toggleItem(arr, setter, item) {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  }

  function canSave() {
    return name.trim() && rolePreference && selectedSkills.length > 0 && interests.length > 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const proficiency = {};
      selectedSkills.forEach((s) => { proficiency[s] = 'intermediate'; });

      await api.updateProfile({
        profile: {
          name,
          university,
          year,
          bio,
          github_url: github,
          linkedin_url: linkedin,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${name.replace(/\s/g, '')}`,
        },
        skills: {
          technical: selectedSkills,
          proficiency,
        },
        preferences: {
          hackathon_interests: interests,
          role_preference: rolePreference,
          looking_for_roles: user?.preferences?.looking_for_roles || [],
          availability: user?.preferences?.availability || 'full-time',
          timezone: user?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      await refreshUser();
      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="edit-profile-screen">
      <div className="edit-profile-container animate-fade-in-up">
        <h1 className="edit-profile-title">Edit Profile</h1>
        <p className="edit-profile-subtitle">Update your preferences and details</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success" style={{ color: '#10b981', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>{success}</div>}

        <form onSubmit={handleSave} className="edit-profile-form">
          <section className="form-section">
            <h2>Basic Info</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="ep-name">Your Name *</label>
              <input
                id="ep-name"
                type="text"
                className="form-input"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Role *</label>
              <div className="chip-grid">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`chip ${rolePreference === role ? 'chip-active' : ''}`}
                    onClick={() => setRolePreference(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Skills & Interests</h2>
            <div className="form-group">
              <label className="form-label">
                Technical Skills * <span className="form-count">{selectedSkills.length} selected</span>
              </label>
              <div className="chip-grid">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    className={`chip ${selectedSkills.includes(skill) ? 'chip-active' : ''}`}
                    onClick={() => toggleItem(selectedSkills, setSelectedSkills, skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Hackathon Interests * <span className="form-count">{interests.length} selected</span>
              </label>
              <div className="chip-grid">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    className={`chip ${interests.includes(interest) ? 'chip-active' : ''}`}
                    onClick={() => toggleItem(interests, setInterests, interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Optional Details</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="ep-university">University</label>
              <input
                id="ep-university"
                type="text"
                className="form-input"
                placeholder="Stanford University"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-year">Year</label>
              <input
                id="ep-year"
                type="text"
                className="form-input"
                placeholder="Junior, Senior, Graduate..."
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-bio">Bio</label>
              <textarea
                id="ep-bio"
                className="form-input form-textarea"
                placeholder="A quick intro about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-github">GitHub URL</label>
              <input
                id="ep-github"
                type="url"
                className="form-input"
                placeholder="https://github.com/username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ep-linkedin">LinkedIn URL</label>
              <input
                id="ep-linkedin"
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
          </section>

          <div className="edit-profile-actions">
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
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
