import React, { useState } from 'react';

function Calendar({value, onChange}){
  const [cursor, setCursor] = useState(new Date(value || Date.now()));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const days = (()=>{
    const arr = [];
    const startWeekday = start.getDay();
    for(let i=0;i<startWeekday;i++) arr.push(null);
    for(let d=1; d<=end.getDate(); d++) arr.push(new Date(year, month, d));
    return arr;
  })();

  function prevMonth(){ setCursor(new Date(year, month-1, 1)); }
  function nextMonth(){ setCursor(new Date(year, month+1, 1)); }

  function isSameDay(a,b){ if(!a||!b) return false; return a.toDateString() === b.toDateString(); }

  return (
    <div className="calendar">
      <header className="calendar-header">
        <button onClick={prevMonth} aria-label="Previous month">‹</button>
        <div>{cursor.toLocaleString(undefined,{month:'long', year:'numeric'})}</div>
        <button onClick={nextMonth} aria-label="Next month">›</button>
      </header>
      <div className="calendar-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=> <div key={d} className="calendar-weekday">{d}</div>)}
        {days.map((dt, idx) => (
          <button
            key={idx}
            className={"calendar-day" + (isSameDay(dt, value) ? ' is-selected':'' )}
            onClick={() => onChange(dt)}
            disabled={!dt}
          >
            {dt? dt.getDate(): ''}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function StudentHome(){
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [building, setBuilding] = useState('Any');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');

  const sampleClasses = [
    {id:1, name:'Accounting 101'},
    {id:2, name:'Business Law'},
    {id:3, name:'Computer Science I'},
    {id:4, name:'Data Structures'},
    {id:5, name:'Economics'},
    {id:6, name:'Mathematics'},
    {id:7, name:'Physics'},
    {id:8, name:'Statistics'},
  ];

  return (
    <div className="student-home">
      <nav className="student-navbar" aria-label="Student navigation">
        <div className="student-navbar__brand">
          <div className="student-navbar__logo">S</div>
          <div>
            <strong>Strathmore University</strong>
            <span>Free Classroom Finder</span>
          </div>
        </div>

        <div className="student-navbar__actions">
          <button type="button" className="nav-action nav-action--ghost">
            <span className="nav-action__icon" aria-hidden="true">◯</span>
            <span className="sr-only">Profile</span>
          </button>
          <button type="button" className="nav-action nav-action--outline">
            <span className="nav-action__icon" aria-hidden="true">↪</span>
            <span className="sr-only">Logout</span>
          </button>
        </div>
      </nav>

      <section className="student-main">
        <div className="student-results">
          <div className="student-results__canvas">
            <h3>List of Classes</h3>
            <div className="class-grid" aria-label="List of classes">
              {sampleClasses.map((item) => (
                <a key={item.id} href="/" className="class-link">
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <aside className="student-sidebar">
          <div className="calendar-wrap">
            <h4>Calendar</h4>
            <Calendar value={selectedDate} onChange={(d) => d && setSelectedDate(d)} />
          </div>

          <div className="spec-panel">
            <label>
              Time Period
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
            <label>
              <span className="sr-only">End time</span>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </label>
            <label>
              Building
              <select value={building} onChange={(e) => setBuilding(e.target.value)}>
                <option>Any</option>
                <option>Main Building</option>
                <option>Science Block</option>
                <option>Old Hall</option>
              </select>
            </label>
            <div className="spec-actions">
              <button type="button" className="primary-button">
                Search
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
