import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './CreateProject.css';

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams(); // If present, we are editing

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [hackathonName, setHackathonName] = useState('');
  const [hackathonCategory, setHackathonCategory] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [description, setDescription] = useState('');
  
  const [teamSize, setTeamSize] = useState(4);
  const [members, setMembers] = useState([]); // [{ name: '', role: '', user_id: null }]
  
  const [requiredRoles, setRequiredRoles] = useState([]); // [{ role: '', count: 1 }]
  const [requiredSkills, setRequiredSkills] = useState(''); // Comma separated string for simplicity
  
  const [githubUrl, setGithubUrl] = useState('');
  const [communicationLink, setCommunicationLink] = useState('');

  useEffect(() => {
    // If we're editing, load the existing project
    if (editId) {
      setLoading(true);
      api.getMyProject()
        .then(proj => {
          if (proj) {
            setTitle(proj.title || '');
            setHackathonName(proj.hackathon_name || '');
            setHackathonCategory(proj.hackathon_category || '');
            setProblemStatement(proj.problem_statement || '');
            setDescription(proj.description || '');
            setTeamSize(proj.team_size || 4);
            setMembers(proj.members || []);
            setRequiredRoles(proj.required_roles || []);
            setRequiredSkills(proj.required_skills?.join(', ') || '');
            setGithubUrl(proj.github_url || '');
            setCommunicationLink(proj.communication_link || '');
          }
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      // If creating, initialize with self
      if (user) {
        setMembers([
          { 
            user_id: user.id, 
            name: user.profile?.name || 'Me', 
            role: user.preferences?.role_preference || '' 
          }
        ]);
      }
    }
  }, [editId, user]);

  // Member Handlers
  const handleAddMember = () => {
    setMembers([...members, { name: '', role: '', user_id: null }]);
  };

  const handleUpdateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleRemoveMember = (index) => {
    const updated = members.filter((_, i) => i !== index);
    setMembers(updated);
  };

  // Role Handlers
  const handleAddRole = () => {
    setRequiredRoles([...requiredRoles, { role: '', count: 1 }]);
  };

  const handleUpdateRole = (index, field, value) => {
    const updated = [...requiredRoles];
    if (field === 'count') {
      value = parseInt(value, 10) || 1;
    }
    updated[index][field] = value;
    setRequiredRoles(updated);
  };

  const handleRemoveRole = (index) => {
    const updated = requiredRoles.filter((_, i) => i !== index);
    setRequiredRoles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        hackathon_name: hackathonName,
        hackathon_category: hackathonCategory,
        problem_statement: problemStatement,
        description,
        team_size: parseInt(teamSize, 10) || 4,
        members: members.filter(m => m.name.trim() !== ''),
        required_roles: requiredRoles.filter(r => r.role.trim() !== ''),
        required_skills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        github_url: githubUrl,
        communication_link: communicationLink,
      };

      if (editId) {
        await api.updateProject(editId, payload);
      } else {
        await api.createProject(payload);
      }
      
      navigate('/team');
    } catch (err) {
      setError(err.message || 'Failed to save project');
      setLoading(false);
    }
  };

  if (loading && editId) {
    return <div className="page-container" style={{padding: '2rem'}}>Loading project details...</div>;
  }

  return (
    <div className="page-container create-project-page">
      <div className="create-project-container">
        <h1>{editId ? 'Edit Project' : 'Create Project'}</h1>
        <p className="subtitle">
          Define your project and team requirements so others can find and join you.
        </p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="project-form">
          
          {/* Basic Information */}
          <section className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label>Project Name *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI Study Buddy" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hackathon Name</label>
                <input type="text" value={hackathonName} onChange={e => setHackathonName(e.target.value)} placeholder="e.g. Global AI Hack" />
              </div>
              <div className="form-group">
                <label>Category / Track</label>
                <input type="text" value={hackathonCategory} onChange={e => setHackathonCategory(e.target.value)} placeholder="e.g. Education" />
              </div>
            </div>

            <div className="form-group">
              <label>Problem Statement</label>
              <textarea rows="2" value={problemStatement} onChange={e => setProblemStatement(e.target.value)} placeholder="What problem are you solving?" />
            </div>

            <div className="form-group">
              <label>Project Description *</label>
              <textarea rows="4" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your solution..." />
            </div>
          </section>

          {/* Team Information */}
          <section className="form-section">
            <h2>Team Information</h2>
            
            <div className="form-group">
              <label>Total Team Size Limit</label>
              <input type="number" min="1" max="10" value={teamSize} onChange={e => setTeamSize(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Current Team Members</label>
              <p className="field-hint">List yourself and anyone else already on the team.</p>
              
              <div className="dynamic-list">
                {members.map((m, i) => (
                  <div key={i} className="dynamic-row">
                    <input 
                      type="text" 
                      placeholder="Name" 
                      value={m.name} 
                      onChange={e => handleUpdateMember(i, 'name', e.target.value)} 
                      disabled={m.user_id && m.user_id === user.id} 
                    />
                    <input 
                      type="text" 
                      placeholder="Role (e.g. Backend)" 
                      value={m.role} 
                      onChange={e => handleUpdateMember(i, 'role', e.target.value)} 
                    />
                    {!(m.user_id && m.user_id === user.id) && (
                      <button type="button" className="btn-icon" onClick={() => handleRemoveMember(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary btn-small" onClick={handleAddMember}>+ Add Member</button>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="form-section">
            <h2>Looking For (Requirements)</h2>
            
            <div className="form-group">
              <label>Roles Needed</label>
              <p className="field-hint">Specify the roles and number of open positions.</p>
              
              <div className="dynamic-list">
                {requiredRoles.map((r, i) => (
                  <div key={i} className="dynamic-row">
                    <input 
                      type="text" 
                      placeholder="Role Name (e.g. AI Engineer)" 
                      value={r.role} 
                      onChange={e => handleUpdateRole(i, 'role', e.target.value)} 
                    />
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Count" 
                      value={r.count} 
                      onChange={e => handleUpdateRole(i, 'count', e.target.value)} 
                      style={{ width: '100px' }}
                    />
                    <button type="button" className="btn-icon" onClick={() => handleRemoveRole(i)}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn-secondary btn-small" onClick={handleAddRole}>+ Add Role</button>
              </div>
            </div>

            <div className="form-group">
              <label>Skills Needed (comma separated)</label>
              <input type="text" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="e.g. React, Python, MongoDB" />
            </div>
          </section>

          {/* Additional Info */}
          <section className="form-section">
            <h2>Additional Information</h2>
            
            <div className="form-group">
              <label>GitHub Repository URL (Optional)</label>
              <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>

            <div className="form-group">
              <label>Communication Link (Optional)</label>
              <input type="url" value={communicationLink} onChange={e => setCommunicationLink(e.target.value)} placeholder="Discord, Slack, WhatsApp group link" />
            </div>
          </section>

          <div className="form-actions-bottom">
            <button type="button" className="btn-secondary" onClick={() => navigate('/team')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (editId ? 'Save Changes' : 'Create Project')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
