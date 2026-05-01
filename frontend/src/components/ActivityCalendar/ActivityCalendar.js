import React from 'react';
import './ActivityCalendar.css';

export default function ActivityCalendar({ activityData = [] }) {
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filter activity data for current month
    const monthActivity = activityData.filter(day => {
        const date = new Date(day.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Month names
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    // Create activity map for quick lookup
    const activityMap = {};
    monthActivity.forEach(day => {
        activityMap[day.date] = day;
    });

    // Generate calendar days
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push({ empty: true, key: `empty-${i}` });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateKey = date.toISOString().split('T')[0];
        const activity = activityMap[dateKey];
        const isToday = day === today.getDate();

        calendarDays.push({
            day,
            date: dateKey,
            activity: activity || { count: 0, level: 0 },
            isToday,
            key: dateKey
        });
    }

    const getActivityClass = (level) => {
        switch(level) {
            case 0: return 'activity-none';
            case 1: return 'activity-low';
            case 2: return 'activity-medium';
            case 3: return 'activity-high';
            default: return 'activity-none';
        }
    };

    const getTooltipText = (dayData) => {
        if (dayData.empty) return '';
        if (dayData.activity.count === 0) return `${monthNames[currentMonth]} ${dayData.day}: No sessions`;
        if (dayData.activity.count === 1) return `${monthNames[currentMonth]} ${dayData.day}: 1 session`;
        return `${monthNames[currentMonth]} ${dayData.day}: ${dayData.activity.count} sessions`;
    };

    return (
        <div className="activity-calendar glass-panel">
            <div className="calendar-header">
                <h3>{monthNames[currentMonth]} {currentYear}</h3>
                <p className="calendar-subtitle">Practice Activity</p>
            </div>
            
            <div className="calendar-weekdays">
                <div className="weekday">S</div>
                <div className="weekday">M</div>
                <div className="weekday">T</div>
                <div className="weekday">W</div>
                <div className="weekday">T</div>
                <div className="weekday">F</div>
                <div className="weekday">S</div>
            </div>

            <div className="calendar-grid">
                {calendarDays.map((dayData) => (
                    <div
                        key={dayData.key}
                        className={`calendar-day ${dayData.empty ? 'empty' : ''} ${
                            dayData.isToday ? 'today' : ''
                        } ${!dayData.empty ? getActivityClass(dayData.activity.level) : ''}`}
                        title={getTooltipText(dayData)}
                    >
                        {!dayData.empty && (
                            <>
                                <span className="day-number">{dayData.day}</span>
                                {dayData.activity.count > 0 && (
                                    <span className="activity-indicator">•</span>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="calendar-legend">
                <span className="legend-label">Less</span>
                <div className="legend-item activity-none"></div>
                <div className="legend-item activity-low"></div>
                <div className="legend-item activity-medium"></div>
                <div className="legend-item activity-high"></div>
                <span className="legend-label">More</span>
            </div>
        </div>
    );
}
