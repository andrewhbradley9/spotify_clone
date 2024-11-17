import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;
const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const getMonthRange = (year, month) => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const getPastYearRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
};

const AdminReports = () => {
    const [totalUsers, setTotalUsers] = useState(null);
    const [totalUsersUpToDate, setTotalUsersUpToDate] = useState(null);
    const [totalActiveSubscribers, setTotalActiveSubscribers] = useState(0);
    const [activeSubscribers, setActiveSubscribers] = useState(0);
    const [inactiveSubscribers, setInactiveSubscribers] = useState(0);
    const [userDisplayOption, setUserDisplayOption] = useState("newUsers");

    const { startDate: defaultStartDate, endDate: defaultEndDate } = getCurrentMonthRange();
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);


    useEffect(() => {
        const fetchUserData = async () => {
            if (userDisplayOption === "newUsers" && startDate && endDate) {
                try {
                    const userRes = await axios.get(`http://localhost:3360/artists/all/users`, {
                        params: { startDate, endDate },
                    });
                    setTotalUsers(userRes.data.total_users || 0);
                } catch (err) {
                    console.log("Error fetching user data:", err);
                }
            } else if (userDisplayOption === "usersUpToDate" && endDate) {
                try {
                    const totalUserRes = await axios.get(`http://localhost:3360/artists/all/users`, {
                        params: { endDate },
                    });
                    setTotalUsersUpToDate(totalUserRes.data.total_users_up_to_date || 0);
                } catch (err) {
                    console.log("Error fetching total users up to date:", err);
                }
            }
        };

        const fetchSubscriberData = async () => {
            if (startDate && endDate) {
                try {
                    const subscriberRes = await axios.get(`http://localhost:3360/artists/all/subscribers`, {
                        params: { startDate, endDate },
                    });
                    setActiveSubscribers(subscriberRes.data.active_subscribers || 0);
                    setInactiveSubscribers(subscriberRes.data.inactive_subscribers || 0);
                } catch (err) {
                    console.log("Error fetching subscriber data:", err);
                }
            }
        };

        const fetchTotalActiveSubscribers = async () => {
            if (endDate) {
                try {
                    const activeRes = await axios.get(`http://localhost:3360/artists/all/subscribers`, {
                        params: { endDate, mode: 'cumulative' },
                    });
                    console.log("Total Active Subscribers Response:", activeRes.data);
                    setTotalActiveSubscribers(activeRes.data.total_active_subscribers || 0);
                } catch (err) {
                    console.log("Error fetching total active subscribers:", err);
                }
            }
        };

        fetchUserData();
        fetchSubscriberData();
        fetchTotalActiveSubscribers();
    }, [startDate, endDate, userDisplayOption]);

    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/artist');
    };

    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>Home</button>
            <h1>Monthly Reports</h1>

            <section>
                <h2>User Account Report</h2>
                <div>
                    <label>
                        Start Date:
                        <input type="date" value={startDate} onChange={(e) =>
 setStartDate(e.target.value)} />
                    </label>
                    <label>
                        End Date:
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </label>
                    <label>
                        <p>User Display Option:</p>
                        <select value={userDisplayOption} onChange={(e) => setUserDisplayOption(e.target.value)}>
                            <option value="newUsers">Total New Users</option>
                            <option value="usersUpToDate">Total Users</option>
                        </select>
                    </label>
                </div>
                <div>
                    {userDisplayOption === "newUsers" ? (
                        <p>Total New Users: {totalUsers !== null ? totalUsers : 'Loading...'}</p>
                    ) : (
                        <p>Total Users: {totalUsersUpToDate !== null ? totalUsersUpToDate : 'Loading...'}</p>
                    )}
                    <label>
                        <p>Subscriber Display Option:</p>
                        <select value={userDisplayOption} onChange={(e) => setUserDisplayOption(e.target.value)}>
                            <option value="activeSubscribers">Total New Active Subscribers</option>
                            <option value="totalActiveSubscribers">Total Active Subscribers</option>
                        </select>
                    </label>
                    {userDisplayOption === "activeSubscribers" ? (
                        <p>Total New Active Subscribers: {activeSubscribers !== null ? activeSubscribers : 'Loading...'}</p>
                    ) : (
                        <p>Total Active Subscribers: {totalActiveSubscribers !== null ? totalActiveSubscribers : 'Loading...'}</p>
                    )}
                    <p>Inactive Subscribers: {inactiveSubscribers}</p>
                </div>
            </section>
        </div>
    );
};

export default AdminReports;