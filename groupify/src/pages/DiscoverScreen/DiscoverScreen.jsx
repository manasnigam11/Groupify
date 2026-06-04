import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityCard from '../../components/CommunityCard/CommunityCard';
import { communities } from '../../data/mockData';
import './DiscoverScreen.css';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'outdoors', label: '🥾 Outdoors' },
  { id: 'food', label: '🍜 Food' },
  { id: 'tech', label: '💻 Tech' },
  { id: 'fitness', label: '💪 Fitness' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'creative', label: '🎨 Creative' },
  { id: 'entertainment', label: '🎬 Entertainment' },
  { id: 'learning', label: '📚 Learning' },
];

export default function DiscoverScreen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = useMemo(() => {
    let result = communities;
    if (activeCategory !== 'all') {
      result = result.filter((c) => c.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [search, activeCategory]);

  const handleCommunityClick = (id) => {
    navigate(`/community/${id}`);
  };

  return (
    <div className="discover-screen" id="discover-screen">
      <div className="discover-header animate-fade-in-up">
        <h1 className="page-title">Discover</h1>
        <p className="page-subtitle">Find your next community</p>
      </div>

      {/* Search */}
      <div className="discover-search animate-fade-in-up stagger-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          type="text"
          placeholder="Search communities, interests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="discover-search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="category-scroll animate-fade-in-up stagger-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="discover-results">
        {filtered.length === 0 && (
          <div className="discover-empty animate-fade-in">
            <span className="empty-emoji">🔍</span>
            <p className="empty-title">No communities found</p>
            <p className="empty-subtitle">Try a different search or category</p>
          </div>
        )}
        {filtered.map((community, index) => (
          <div
            key={community.id}
            className={`animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
          >
            <CommunityCard
              community={community}
              variant="default"
              onClick={handleCommunityClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
