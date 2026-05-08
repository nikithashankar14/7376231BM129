import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://4.224.186.213/evaluation-service/notifications';
const TOP_OPTIONS = [5, 10, 15, 20];
const TYPES = ['All', 'Placement', 'Result', 'Event'];
const TYPE_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

/**
 * Normalize the incoming API payload into a consistent notification object.
 */
function parseNotification(raw) {
  const timestamp = raw.Timestamp || raw.timestamp || '';
  const parsedDate = new Date(timestamp);
  return {
    id: raw.ID || raw.id || Math.random().toString(36).slice(2),
    type: raw.Type || raw.type || 'Unknown',
    message: raw.Message || raw.message || 'No message',
    timestamp,
    date: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
  };
}

/**
 * Compute a priority score using type weight and recency.
 * Higher score means higher priority in the Priority Inbox.
 */
function scoreNotification(notification) {
  const weight = TYPE_WEIGHTS[notification.type] || 0;
  const ageSeconds = (Date.now() - notification.date.getTime()) / 1000;
  return weight * 100000 - ageSeconds;
}

function App() {
  const [activePage, setActivePage] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [topCount, setTopCount] = useState(10);
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('notificationAuthToken') || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [error, setError] = useState(null);
  const [viewedIds, setViewedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('viewedNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [lastRefreshed, setLastRefreshed] = useState(null);

  useEffect(() => {
    localStorage.setItem('viewedNotifications', JSON.stringify(viewedIds));
  }, [viewedIds]);

  useEffect(() => {
    localStorage.setItem('notificationAuthToken', authToken);
  }, [authToken]);

  useEffect(() => {
    async function loadNotifications() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: '100', page: '1' });
        if (selectedType !== 'All') {
          params.set('notification_type', selectedType);
        }
        const headers = new Headers();
        if (authToken) {
          headers.set('Authorization', `Bearer ${authToken}`);
        }
        const response = await fetch(`${API_BASE}?${params}`, { headers });
        if (!response.ok) {
          throw new Error(`Unable to reach notification service (${response.status})`);
        }
        const body = await response.json();
        const rawItems = Array.isArray(body.notifications) ? body.notifications : [];
        setNotifications(rawItems.map(parseNotification));
        setLastRefreshed(new Date());
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to fetch notifications. Check the token and network.');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, [selectedType, authToken, refreshIndex]);

  const allFiltered = useMemo(() => {
    if (selectedType === 'All') return notifications;
    return notifications.filter((item) => item.type === selectedType);
  }, [notifications, selectedType]);

  const priorityNotifications = useMemo(() => {
    return [...allFiltered]
      .sort((a, b) => scoreNotification(b) - scoreNotification(a))
      .slice(0, topCount);
  }, [allFiltered, topCount]);

  const unseenCount = notifications.filter((item) => !viewedIds.includes(item.id)).length;

  function markViewed(id) {
    setViewedIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function markAllViewed() {
    setViewedIds(notifications.map((item) => item.id));
  }

  function refreshNotifications() {
    setRefreshIndex((current) => current + 1);
  }

  const pageTitle = activePage === 'all' ? 'All Notifications' : 'Priority Inbox';
  const currentList = activePage === 'all' ? allFiltered : priorityNotifications;

  return (
    <div className="app-shell">
      <div className="dashboard-top">
        <header className="dashboard-card dashboard-summary-card">
          <p className="app-tag">Campus Notification Platform</p>
          <div className="summary-grid">
            <div>
              <h1>{pageTitle}</h1>
              <p className="app-subtitle">
                New: <span className="status-new">{unseenCount}</span> · Total fetched:{' '}
                <span className="status-total">{notifications.length}</span>
              </p>
              {lastRefreshed && (
                <p className="app-meta">Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
              )}
            </div>
            <div className="header-actions">
              <div className="tab-row">
                <button
                  type="button"
                  className={activePage === 'all' ? 'tab-button active' : 'tab-button'}
                  onClick={() => setActivePage('all')}
                >
                  All Notifications
                </button>
                <button
                  type="button"
                  className={activePage === 'priority' ? 'tab-button active' : 'tab-button'}
                  onClick={() => setActivePage('priority')}
                >
                  Priority Notifications
                </button>
              </div>
              <button
                type="button"
                className="ghost-button refresh-button"
                onClick={refreshNotifications}
              >
                Refresh
              </button>
            </div>
          </div>
        </header>
      </div>

      <section className="dashboard-card controls-panel">
        <div className="control-group">
          <label htmlFor="authToken">Authorization token</label>
          <input
            id="authToken"
            type="text"
            value={authToken}
            onChange={(event) => setAuthToken(event.target.value)}
            placeholder="Paste bearer token here"
          />
        </div>

        <div className="control-group">
          <label htmlFor="filterType">Filter type</label>
          <select
            id="filterType"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="topCount">Top notifications</label>
          <select
            id="topCount"
            value={topCount}
            onChange={(event) => setTopCount(Number(event.target.value))}
          >
            {TOP_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="action-group">
          <button type="button" className="ghost-button" onClick={() => setSelectedType('All')}>
            Reset Filter
          </button>
          <button type="button" className="ghost-button" onClick={markAllViewed}>
            Mark all viewed
          </button>
        </div>
      </section>

      <main className="content-panel">
        {loading ? (
          <div className="status-box">Loading latest notifications…</div>
        ) : error ? (
          <div className="status-box status-error">{error}</div>
        ) : currentList.length === 0 ? (
          <div className="status-box">No notifications available for this view.</div>
        ) : (
          <div className="notification-grid">
            {currentList.map((item) => {
              const viewed = viewedIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className={viewed ? 'notification-card viewed' : 'notification-card new-card'}
                  onClick={() => markViewed(item.id)}
                >
                  <div className="notification-meta">
                    <span className="notification-type">{item.type}</span>
                    <span className="notification-badge">
                      {viewed ? 'Viewed' : 'New'}
                    </span>
                  </div>
                  <p className="notification-message">{item.message}</p>
                  <div className="notification-footer">
                    <span>{item.date.toLocaleString()}</span>
                    {activePage === 'priority' && (
                      <span className="notification-score">
                        Score: {Math.round(scoreNotification(item))}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Use the token field for protected API access and click a card to mark it as viewed.</p>
      </footer>
    </div>
  );
}

export default App;
