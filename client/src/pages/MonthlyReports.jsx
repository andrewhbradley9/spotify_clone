import React, { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
const apiUrl = process.env.REACT_APP_API_URL;
const MonthlyReports = () => {
    const [newUsers, setNewUsers] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [error, setError] = useState(null);
    
    // States for grouped data
    const [groupedUsers, setGroupedUsers] = useState({});
    const [groupedSubscriptions, setGroupedSubscriptions] = useState({});
    const currentMonthIndex = new Date().getMonth(); // 0 = January, 11 = December
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const currentMonth = monthNames[currentMonthIndex];
    const navigate = useNavigate();
    const handleGoHome = () => {
        navigate('/'); // Navigate to the main page
    };
    useEffect(() => {
        // Fetch new users and subscriptions
        const fetchMonthlyReports = async () => {
            try {
                // Fetch new users
                const userRes = await axios.get(`${apiUrl}/artists/monthly/new/users`);
                if (userRes.data && Array.isArray(userRes.data)) {
                    setNewUsers(userRes.data);
                    // Group users by month
                    const userGrouped = userRes.data.reduce((acc, curr) => {
                        const { month } = curr;
                        acc[month] = acc[month] || [];
                        acc[month].push(curr);
                        return acc;
                    }, {});
                    setGroupedUsers(userGrouped);
                } else {
                    console.error("Unexpected response structure for new users:", userRes.data);
                }

                // Fetch new subscriptions
                const subscriptionRes = await axios.get(`${apiUrl}/artists/monthly/subscriptions`);
                if (subscriptionRes.data && Array.isArray(subscriptionRes.data)) {
                    setSubscriptions(subscriptionRes.data);
                    // Group subscriptions by month
                    const subGrouped = subscriptionRes.data.reduce((acc, curr) => {
                        const { month } = curr;
                        acc[month] = acc[month] || [];
                        acc[month].push(curr);
                        return acc;
                    }, {});
                    setGroupedSubscriptions(subGrouped);
                } else {
                    console.error("Unexpected response structure for subscriptions:", subscriptionRes.data);
                }
            } catch (err) {
                console.error("Error fetching monthly reports:", err);
                setError('Failed to fetch monthly reports.');
            }
        };

        fetchMonthlyReports();
    }, []); // Run on mount

    return (
        <div className="monthly-reports">
            <p>
                <button className="cancel" onClick={handleGoHome}>Back Home</button>
            </p>
            <h1>Wall of Fame</h1>
            <h2>
                <p>{currentMonth} {new Date().getFullYear()}</p> {/* Display current month and year */}
            </h2>
    
            {error && <p className="error">{error}</p>}
    
{/* New Users Section */}
<h2>New Users</h2>
<section className="report-section">
    {Object.keys(groupedUsers).length > 0 ? (
        Object.entries(groupedUsers).map(([month, users]) => (
            <div key={month} className="report-group">
                <ul>
                    {users.map((user, index) => (
                        <li key={index}>
                            {user.name} {/* Only display the user's name */}
                        </li>
                    ))}
                </ul>
            </div>
        ))
    ) : (
        <p>No new users to display.</p>
    )}
</section>

{/* Subscriptions Section */}
<h2>New Subscribers</h2>
<section className="report-section">
    {Object.keys(groupedSubscriptions).length > 0 ? (
        Object.entries(groupedSubscriptions).map(([month, subs]) => (
            <div key={month} className="report-group">
                <ul>
                    {subs.map((sub, index) => (
                        <li key={index}>
                            {sub.name} {/* Only display the user's name */}
                        </li>
                    ))}
                </ul>
            </div>
        ))
    ) : (
        <p>No subscriptions to display.</p>
    )}
</section>
        </div>
    );
};

export default MonthlyReports;
