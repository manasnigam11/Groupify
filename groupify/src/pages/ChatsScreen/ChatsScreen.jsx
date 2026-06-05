import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';
import './ChatsScreen.css';

export default function ChatsScreen() {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialUserId = queryParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // { id (userId or projectId), name, avatar, isTeam }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // Helper: Format Date/Time to Mumbai Server Time (IST)
  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();

    const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' };
    const timeStr = date.toLocaleTimeString('en-IN', timeOptions);

    const dateIST = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const nowIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    if (
      dateIST.getDate() === nowIST.getDate() &&
      dateIST.getMonth() === nowIST.getMonth() &&
      dateIST.getFullYear() === nowIST.getFullYear()
    ) {
      return timeStr; // Aaj ka message hai toh sirf time
    } else {
      const dateOptions = { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' };
      const dateStr = date.toLocaleDateString('en-IN', dateOptions);
      return `${dateStr}, ${timeStr}`; // Purana message hai toh Date + Time
    }
  };

  // Load conversations and Team data
  useEffect(() => {
    async function loadData() {
      try {
        const [convs, project] = await Promise.all([
          api.getConversations(),
          api.getMyProject().catch(() => null)
        ]);
        
        setConversations(convs);
        setMyTeam(project);
        
        if (initialUserId) {
          const existing = convs.find(c => c.other_user_id === initialUserId);
          if (existing) {
            setActiveChat({ id: existing.other_user_id, name: existing.other_user_name, avatar: existing.other_user_avatar, isTeam: false });
          } else {
            const profile = await api.getPublicProfile(initialUserId);
            setActiveChat({ id: initialUserId, name: profile.profile.name, avatar: profile.profile.avatar_url, isTeam: false });
          }
        } else if (project) {
            // Default to team chat if they have a team
            setActiveChat({ id: project.id || project._id, name: `${project.title} (Team)`, avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=team', isTeam: true });
        } else if (convs.length > 0) {
          setActiveChat({ id: convs[0].other_user_id, name: convs[0].other_user_name, avatar: convs[0].other_user_avatar, isTeam: false });
        }
      } catch (err) {
        console.error("Failed to load chats data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [initialUserId]);

  // Load messages for active chat, set up simple polling
  useEffect(() => {
    let interval;
    async function loadMessages() {
      if (!activeChat) return;
      try {
        const msgs = activeChat.isTeam 
          ? await api.getTeamMessages(activeChat.id)
          : await api.getMessages(activeChat.id);
          
        setMessages(msgs);
        scrollToBottom();
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }

    if (activeChat) {
      loadMessages();
      interval = setInterval(loadMessages, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const content = newMessage;
    setNewMessage(''); 
    
    const tempMsg = {
      id: Date.now().toString(),
      sender_id: user.id,
      sender_name: "Me",
      content,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      if (activeChat.isTeam) {
        await api.sendTeamMessage(activeChat.id, content);
      } else {
        await api.sendMessage(activeChat.id, content);
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }

  if (loading) {
    return <div className="page-container" style={{padding: '2rem'}}>Loading chats...</div>;
  }

  return (
    <div className="page-container chats-page">
      <div className="chats-layout">
        
        {/* Left Pane: Conversations */}
        <div className="chats-sidebar">
          <div className="chats-sidebar-header">
            <h2>Messages</h2>
          </div>
          
          <div className="conversations-list">
            {/* Team Chat Section */}
            {myTeam && (
              <div 
                className={`conversation-item team-chat-item ${activeChat?.id === (myTeam.id || myTeam._id) ? 'active' : ''}`}
                onClick={() => setActiveChat({
                  id: myTeam.id || myTeam._id,
                  name: `${myTeam.title} (Team)`,
                  avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=team',
                  isTeam: true
                })}
                style={{ borderBottom: '2px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '0.5rem' }}
              >
                <img src={'https://api.dicebear.com/7.x/shapes/svg?seed=team'} alt="Team" style={{ borderRadius: '8px' }} />
                <div className="conversation-info">
                  <h4 style={{ color: 'var(--primary-light)' }}>{myTeam.title}</h4>
                  <p>Team Group Chat</p>
                </div>
              </div>
            )}

            {conversations.length === 0 && !initialUserId && !myTeam && (
              <div className="no-conversations">
                <p>No messages yet.</p>
                <button className="btn-primary" onClick={() => window.location.href = '/find'} style={{marginTop: '1rem'}}>Find Teammates</button>
              </div>
            )}
            
            {initialUserId && !conversations.find(c => c.other_user_id === initialUserId) && activeChat?.id === initialUserId && (
              <div className="conversation-item active">
                <img src={activeChat.avatar} alt={activeChat.name} />
                <div className="conversation-info">
                  <h4>{activeChat.name}</h4>
                  <p>New conversation</p>
                </div>
              </div>
            )}

            {conversations.map(conv => (
              <div 
                key={conv.other_user_id} 
                className={`conversation-item ${activeChat?.id === conv.other_user_id ? 'active' : ''}`}
                onClick={() => setActiveChat({
                  id: conv.other_user_id,
                  name: conv.other_user_name,
                  avatar: conv.other_user_avatar,
                  isTeam: false
                })}
              >
                <img src={conv.other_user_avatar} alt={conv.other_user_name} />
                <div className="conversation-info">
                  <h4>{conv.other_user_name}</h4>
                  <p>{conv.last_message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div className="chats-main">
          {activeChat ? (
            <>
              <div className="chat-header">
                <img src={activeChat.avatar} alt={activeChat.name} style={activeChat.isTeam ? {borderRadius: '8px'} : {}} />
                <h3>{activeChat.name}</h3>
              </div>
              
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="no-messages">
                    <p>Start the conversation in {activeChat.name}!</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <div key={msg.id || i} className={`chat-bubble-wrapper ${isMe ? 'mine' : 'theirs'}`}>
                      {/* Show Sender Name in Team Chat for other users */}
                      {activeChat.isTeam && !isMe && msg.sender_name && (
                        <span className="chat-sender-name" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '12px', marginBottom: '2px', display: 'block' }}>
                          {msg.sender_name}
                        </span>
                      )}
                      <div className="chat-bubble">
                        {msg.content}
                      </div>
                      <span className="chat-time">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}