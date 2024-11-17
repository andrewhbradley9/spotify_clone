import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const AdminReports = () => {
    const navigate = useNavigate();

    // States
    const [data, setData] = useState({
        totalUsers: 0,
        totalUsersUpToDate: 0,
        users: [],
        allUsers: [],
        totalActiveSubscribers: 0,
        inactiveSubscribers: 0,
        newActiveSubscribers: 0,
        subscribers: [],
    });
    const [show, setShow] = useState({
        users: false,
        allUsers: false,
        subscribers: false,
    });

    const { startDate, endDate } = getCurrentMonthRange();
    const [dateRange, setDateRange] = useState({ startDate, endDate });

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await axios.get(`http://localhost:3360/artists/all/users`, {
                    params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
                });
                const userUpToDateRes = await axios.get(`http://localhost:3360/artists/all/users`, {
                    params: { endDate: dateRange.endDate },
                });
                const subscriberRes = await axios.get(`http://localhost:3360/artists/all/subscribers`, {
                    params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
                });
                const activeRes = await axios.get(`http://localhost:3360/artists/all/subscribers`, {
                    params: { endDate: dateRange.endDate, mode: 'cumulative' },
                });

                setData({
                    totalUsers: userRes.data.total_users || 0,
                    users: userRes.data.users || [],
                    totalUsersUpToDate: userUpToDateRes.data.total_users_up_to_date || 0,
                    allUsers: userUpToDateRes.data.users || [],
                    subscribers: subscriberRes.data.users || [],
                    inactiveSubscribers: subscriberRes.data.inactive_subscribers || 0,
                    newActiveSubscribers: subscriberRes.data.new_active_subscribers || 0,
                    totalActiveSubscribers: activeRes.data.total_active_subscribers || 0,
                });
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };

        fetchData();
    }, [dateRange]);

    // Handlers
    const toggleShow = (key) => {
        setShow((prev) => ({
            ...prev,
            [key]: !prev[key], // Correctly toggle the specific key
        }));
    };

    const handleGoHome = () => navigate('/artist');
    const handleDateChange = (key, value) =>
        setDateRange((prev) => ({ ...prev, [key]: value }));

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Monthly Reports</h1>

            <section>
                <h2>User Account Report</h2>
                <div>
                    <label>
                        Start Date:
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => handleDateChange('startDate', e.target.value)}
                        />
                    </label>
                    <label>
                        End Date:
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => handleDateChange('endDate', e.target.value)}
                        />
                    </label>
                </div>

                <div>
                    <p>Total New Users: {data.totalUsers}</p>
                    <button onClick={() => toggleShow('users')}>
                        {show.users ? 'Hide Users' : 'View Users'}
                    </button>
                    {show.users && (
                        <ul>
                            {data.users.map((user) => (
                                <li key={user.user_id}>
                                    <strong>{user.username}</strong> (Role: {user.role || 'N/A'})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <p>Total Users Up to Date: {data.totalUsersUpToDate}</p>
                    <button onClick={() => toggleShow('allUsers')}>
                        {show.allUsers ? 'Hide Users Up to Date' : 'View Users Up to Date'}
                    </button>
                    {show.allUsers && (
                        <ul>
                            {data.allUsers.map((user) => (
                                <li key={user.user_id}>
                                    <strong>{user.username}</strong> (Role: {user.role || 'N/A'})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <h2>Subscriber Report</h2>
                <div>
                    <p>New Active Subscribers (This Period): {data.newActiveSubscribers}</p>
                    <button onClick={() => toggleShow('subscribers')}>
                        {show.subscribers ? 'Hide Subscribers' : 'View Subscribers'}
                    </button>
                    {show.subscribers && (
                        <ul>
                            {data.subscribers.map((subscriber) => (
                                <li key={subscriber.user_id}>
                                    <strong>{subscriber.username}</strong> (Role: {subscriber.role || 'N/A'})<br />
                                    Created At: {new Date(subscriber.created_at).toLocaleString()}<br />
                                    Subscription Date: {subscriber.subscription_date
                                        ? new Date(subscriber.subscription_date).toLocaleString()
                                        : 'N/A'}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p>Active Subscribers (Cumulative): {data.totalActiveSubscribers}</p>
                    <p>Inactive Subscribers: {data.inactiveSubscribers}</p>
                </div>
            </section>
        </div>
    );
};

export default AdminReports;
