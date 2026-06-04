import './MeetupCard.css';

export default function MeetupCard({ meetup, communityName }) {
  const date = new Date(meetup.date);
  const month = date.toLocaleString('en', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const spotsLeft = meetup.maxAttendees - meetup.attendees;
  const fillPercent = (meetup.attendees / meetup.maxAttendees) * 100;

  return (
    <div className="meetup-card">
      <div className="meetup-date-badge">
        <span className="meetup-month">{month}</span>
        <span className="meetup-day">{day}</span>
      </div>
      <div className="meetup-info">
        <h4 className="meetup-title">{meetup.title}</h4>
        {communityName && <p className="meetup-community">{communityName}</p>}
        <div className="meetup-meta">
          <span className="meetup-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {meetup.time}
          </span>
          <span className="meetup-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {meetup.location}
          </span>
        </div>
        <div className="meetup-spots">
          <div className="spots-bar">
            <div className="spots-fill" style={{ width: `${fillPercent}%` }} />
          </div>
          <span className="spots-text">{spotsLeft} spots left</span>
        </div>
      </div>
    </div>
  );
}
