import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications as initialNotifications } from '../../data/mockData';
import './NotificationsScreen.css';

const typeIcons = {
  join_accepted: '🎉',
  new_meetup: '📅',
  member_joined: '👋',
  reminder: '⏰',
  trending: '🔥',
};

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState(initialNotifications);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = (notif) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.communityId) {
      navigate(`/community/${notif.communityId}`);
    }
  };

  return (
    <div className="notif-screen" id="notifications-screen">
      <div className="notif-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && (
            <p className="notif-count">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="mark-read-btn" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notif-list">
        {notifs.map((notif, index) => (
          <div
            key={notif.id}
            className={`notif-item ${!notif.read ? 'unread' : ''} animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
            onClick={() => handleNotifClick(notif)}
          >
            <div className="notif-icon-wrap">
              <span className="notif-icon">{typeIcons[notif.type]}</span>
              {!notif.read && <span className="notif-unread-dot" />}
            </div>
            <div className="notif-content">
              <p className="notif-title">{notif.title}</p>
              <p className="notif-message">{notif.message}</p>
              <p className="notif-time">{notif.time}</p>
            </div>
            <svg className="notif-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        ))}
      </div>

      {notifs.length === 0 && (
        <div className="notif-empty animate-fade-in">
          <span className="empty-emoji">🔔</span>
          <p className="empty-title">All caught up!</p>
          <p className="empty-subtitle">No new notifications</p>
        </div>
      )}
    </div>
  );
}
