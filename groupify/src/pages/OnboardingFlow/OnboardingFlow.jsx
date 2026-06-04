import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './OnboardingFlow.css';

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

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Required
  const [name, setName] = useState('');
  const [rolePreference, setRolePreference] = useState('');

  // Step 2 — Required
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [projectIdea, setProjectIdea] = useState('');

  // Step 3 — Optional
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');

  function toggleItem(arr, setter, item) {
    if (arr.includes(item)) {
      setter(arr.filter((i) => i !== item));
    } else {
      setter([...arr, item]);
    }
  }

  function canProceedStep1() {
    return name.trim() && rolePreference;
  }

  function canProceedStep2() {
    return selectedSkills.length >= 1 && interests.length >= 1 && projectIdea.trim();
  }

  async function handleFinish() {
    setError('');
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
          project_idea: projectIdea,
          role_preference: rolePreference,
          looking_for_roles: [],
          availability: 'full-time',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="onboarding-screen" id="onboarding-screen">
      {/* Progress Bar */}
      <div className="onboarding-progress">
        <div
          className="onboarding-progress-bar"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="onboarding-container">
        {/* Step 1: Role & Name */}
        {step === 1 && (
          <div className="onboarding-step animate-fade-in-up" key="step1">
            <div className="step-badge">Step 1 of 3</div>
            <h1 className="onboarding-title">Who are you?</h1>
            <p className="onboarding-subtitle">Tell us your name and what role you play</p>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-name">Your Name *</label>
              <input
                id="ob-name"
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
                    id={`role-${role.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary"
              disabled={!canProceedStep1()}
              onClick={() => setStep(2)}
              id="step1-next"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Skills & Interests */}
        {step === 2 && (
          <div className="onboarding-step animate-fade-in-up" key="step2">
            <div className="step-badge">Step 2 of 3</div>
            <h1 className="onboarding-title">Your Skills</h1>
            <p className="onboarding-subtitle">Select your tech skills and hackathon interests</p>

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
                    id={`skill-${skill.toLowerCase().replace(/[\s\/\+\.]/g, '-')}`}
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
                    id={`interest-${interest.toLowerCase().replace(/[\s\/]/g, '-')}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-idea">Project Idea *</label>
              <textarea
                id="ob-idea"
                className="form-input form-textarea"
                placeholder="Describe your hackathon project idea in a sentence or two..."
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                rows={3}
              />
            </div>

            <div className="onboarding-actions">
              <button className="btn-secondary" onClick={() => setStep(1)} id="step2-back">Back</button>
              <button
                className="btn-primary"
                disabled={!canProceedStep2()}
                onClick={() => setStep(3)}
                id="step2-next"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optional Details */}
        {step === 3 && (
          <div className="onboarding-step animate-fade-in-up" key="step3">
            <div className="step-badge">Step 3 of 3</div>
            <h1 className="onboarding-title">Almost there!</h1>
            <p className="onboarding-subtitle">These details are optional but help with matching</p>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="ob-university">University</label>
              <input
                id="ob-university"
                type="text"
                className="form-input"
                placeholder="Stanford University"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-year">Year</label>
              <input
                id="ob-year"
                type="text"
                className="form-input"
                placeholder="Junior, Senior, Graduate..."
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-bio">Bio</label>
              <textarea
                id="ob-bio"
                className="form-input form-textarea"
                placeholder="A quick intro about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-github">GitHub URL</label>
              <input
                id="ob-github"
                type="url"
                className="form-input"
                placeholder="https://github.com/username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ob-linkedin">LinkedIn URL</label>
              <input
                id="ob-linkedin"
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>

            <div className="onboarding-actions">
              <button className="btn-secondary" onClick={() => setStep(2)} id="step3-back">Back</button>
              <button
                className="btn-primary"
                onClick={handleFinish}
                disabled={saving}
                id="step3-finish"
              >
                {saving ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
