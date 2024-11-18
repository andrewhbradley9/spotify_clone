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
    const [dateRange, setDateRange] = useState(getCurrentMonthRange());
    const [roleFilter, setRoleFilter] = useState('any'); // Role filter
    const [activeTab, setActiveTab] = useState('users');
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [usernameDropdown, setUsernameDropdown] = useState(null); // State for username dropdown
    const [roleDropdownVisible, setRoleDropdownVisible] = useState(false);
    const [data, setData] = useState({
        totalUsers: 0,
        totalUsersUpToDate: 0,
        totalActiveSubscribers: 0,
        inactiveSubscribers: 0,
        newActiveSubscribers: 0,
        users: [], // Ensure this is an array
        allUsers: [], // Ensure this is an array
        subscribers: [],
    });    
    const [lists, setLists] = useState({
        inactiveSubscribers: [],
        cumulativeSubscribers: [],
    });
    const [show, setShow] = useState({
        users: false,
        allUsers: false,
        subscribers: false,
        inactiveSubscribers: false,
        cumulativeSubscribers: false,
    });
    const [sortOrder, setSortOrder] = useState({
        users: 'asc',
        allUsers: 'asc',
        subscribers: 'asc',
        cumulativeSubscribers: 'asc',
        inactiveSubscribers: 'asc',
    });
    const fetchData = async (endpoint, params, setter) => {
        try {
            const res = await axios.get(`http://localhost:3360/artists/all/${endpoint}`, { params });
            setter(res.data);
        } catch (err) {
            console.error(`Error fetching ${endpoint}:`, err.response?.data || err.message);
        }
    };

    useEffect(() => {
        const fetchReports = async () => {
            await fetchData('users', { startDate: dateRange.startDate, endDate: dateRange.endDate }, (data) => {
                setData((prev) => ({
                    ...prev,
                    totalUsers: data.total_users || 0,
                    users: data.users || [],
                }));
            });
            await fetchData('users', { endDate: dateRange.endDate }, (data) => {
                setData((prev) => ({
                    ...prev,
                    totalUsersUpToDate: data.total_users_up_to_date || 0,
                    allUsers: data.users || [],
                }));
            });
            await fetchData(
                'subscribers',
                { startDate: dateRange.startDate, endDate: dateRange.endDate },
                (data) => {
                    setData((prev) => ({
                        ...prev,
                        subscribers: data.users || [],
                        inactiveSubscribers: data.inactive_subscribers || 0,
                        newActiveSubscribers: data.new_active_subscribers || 0,
                    }));
                }
            );
            await fetchData('subscribers', { endDate: dateRange.endDate, mode: 'cumulative' }, (data) => {
                setData((prev) => ({
                    ...prev,
                    totalActiveSubscribers: data.total_active_subscribers || 0,
                }));
            });
        };

        fetchReports();
    }, [dateRange]);

    const handleToggle = (key) => {
        if (!show[key]) {
            const params = { endDate: dateRange.endDate };
            if (key === 'inactiveSubscribers') {
                params.mode = 'inactive';
                fetchData('subscribers', params, (data) =>
                    setLists((prev) => ({ ...prev, inactiveSubscribers: data.inactive_subscribers || [] }))
                );
            }
            if (key === 'cumulativeSubscribers') {
                params.mode = 'cumulative';
                fetchData('subscribers', params, (data) =>
                    setLists((prev) => ({ ...prev, cumulativeSubscribers: data.users || [] }))
                );
            }
        }
        setShow((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDateChange = (key, value) => setDateRange((prev) => ({ ...prev, [key]: value }));
    const handleSort = (key, field, isList = false) => {
        const dataset = isList ? lists[key] : data[key];
    
        // Ensure the dataset is valid
        if (!key || !Array.isArray(dataset)) {
            console.error(`The data for key "${key}" is not iterable or invalid.`);
            return;
        }
    
        // Determine sort order
        const order = sortOrder[key] === 'asc' ? 'desc' : 'asc';
        setSortOrder((prev) => ({ ...prev, [key]: order }));
    
        // Sort the dataset
        const sortedList = [...dataset].sort((a, b) => {
            if (a[field] && b[field]) {
                return order === 'asc' ? a[field].localeCompare(b[field]) : b[field].localeCompare(a[field]);
            }
            return 0; // Default if field is missing
        });
    
        // Update the data or lists
        if (isList) {
            setLists((prev) => ({ ...prev, [key]: sortedList }));
        } else {
            setData((prev) => ({ ...prev, [key]: sortedList }));
        }
    };
    const handleRoleFilterChange = (role) => {
        setRoleFilter(role); // Update the role filter
        setShowDropdown(false); // Close the dropdown after selection
    };

    const filteredData = (list) => {
        let filtered = list;

        // Apply role filter
        if (roleFilter !== 'any') {
            filtered = filtered.filter((item) => item.role === roleFilter);
        }

        // Apply search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((item) => 
                item.username.toLowerCase().includes(query) || 
                (item.artist_id && item.artist_id.toString().includes(query)) // Check artist_id if present
            );
        }

        return filtered;
    };
    const toggleUsernameDropdown = (userId) => {
        setUsernameDropdown((prev) => (prev === userId ? null : userId)); // Toggle username dropdown
    };
    const renderTableWithBorders = (list, headers, key, isList = false) => (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>
                                {header === 'Username' ? (
                                    <span
                                        style={{
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                        }}
                                        onClick={() => handleSort(key, 'username', isList)}
                                    >
                                        {header}
                                    </span>
                                ) : header === 'Role' ? (
                                    <div style={{ position: 'relative' }}>
                                        <span
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setRoleDropdownVisible(!roleDropdownVisible)}
                                        >
                                            {header}
                                        </span>
                                        {roleDropdownVisible && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #ccc',
                                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                                    zIndex: 10,
                                                    minWidth: '150px',
                                                    padding: '5px',
                                                    borderRadius: '4px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() => handleRoleFilterChange('any')}
                                                >
                                                    Any
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() => handleRoleFilterChange('admin')}
                                                >
                                                    Admin
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() => handleRoleFilterChange('artist')}
                                                >
                                                    Artist
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() => handleRoleFilterChange('listener')}
                                                >
                                                    Listener
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    header
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredData(list).map((item) => (
                        <tr key={item.user_id}>
                            <td className="username-cell">
                                {item.artist_id ? (
                                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                                        <span onClick={() => toggleUsernameDropdown(item.user_id)}>
                                            {item.username}
                                        </span>
                                        {usernameDropdown === item.user_id && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '100%',
                                                    left: 0,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #ccc',
                                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                                    zIndex: 10,
                                                    minWidth: '200px',
                                                    padding: '5px',
                                                    borderRadius: '4px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() =>
                                                        window.open(`/ArtistReports?artist_id=${item.artist_id}`, '_blank')
                                                    }
                                                >
                                                    View Artist Report
                                                </div>
                                                <div
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() =>
                                                        window.open(`/artist/${item.artist_id}`, '_blank')
                                                    }
                                                >
                                                    View Artist Profile
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    item.username
                                )}
                            </td>
                            <td className="role-cell">{item.role || 'N/A'}</td>
                            <td className="date-cell">
                                {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="date-cell">
                                {item.subscription_date
                                    ? new Date(item.subscription_date).toLocaleString()
                                    : 'None'}
                            </td>
                            <td className="artist-id-cell">{item.artist_id ? item.artist_id : 'None'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const handleTabChange = (tab) => setActiveTab(tab);
    const handleGoHome = () => navigate('/artist');
    return (
        <div>
            <button className="cancel" onClick={handleGoHome}>
                Home
            </button>
            <h1>Admin Reports</h1>
            <div><p>
                    <label>
                        Search:
                        <input
                            type="text"
                            placeholder="Search by username or artist ID"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>
                    </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <button
                    onClick={() => handleTabChange('users')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'users' ? '#583032' : 'rgba(0, 0, 0, 0.2)',
                        color: activeTab === 'users' ? '#FF0000' : '#FF0000',
                        border: '1px solid #FF0000',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    User Report
                </button>
                <button
                    onClick={() => handleTabChange('subscribers')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'subscribers' ? '#583032' : 'rgba(0, 0, 0, 0.2)',
                        color: activeTab === 'subscribers' ? '#FF0000' : '#FF0000',
                        border: '1px solid #FF0000',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Subscriber Report
                </button>
            </div>
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
            {activeTab === 'users' ? (
        <div>
            <h2>User Report</h2>

            <div>
                <p>Total New Users: {data.totalUsers}</p>
                <button onClick={() => handleToggle('users')}>
                    {show.users ? 'Hide Users' : 'View Users'}
                </button>
                {show.users &&
                    renderTableWithBorders(data.users, [
                        'Username',
                        'Role',
                        'Created At',
                        'Subscription Date',
                        'Artist ID',
                    ],'users')}
            </div>

            <div>
                <p>Total Users Up to Date: {data.totalUsersUpToDate}</p>
                <button onClick={() => handleToggle('allUsers')}>
                    {show.allUsers ? 'Hide Users Up to Date' : 'View Users Up to Date'}
                </button>
                {show.allUsers &&
                    renderTableWithBorders(data.allUsers, [
                        'Username',
                        'Role',
                        'Created At',
                        'Subscription Date',
                        'Artist ID',
                    ],'allUsers')}
            </div>
        </div>
    ) : (
        <div>
            <h2>Subscriber Report</h2>
            <div>
                <p>New Active Subscribers (This Period): {data.newActiveSubscribers}</p>
                <button onClick={() => handleToggle('subscribers')}>
                    {show.subscribers ? 'Hide Subscribers' : 'View Subscribers'}
                </button>
                {show.subscribers &&
                    renderTableWithBorders(data.subscribers, [
                        'Username',
                        'Role',
                        'Created At',
                        'Subscription Date',
                        'Artist ID',
                    ],'subscribers')}

                <p>Active Subscribers (Cumulative): {data.totalActiveSubscribers}</p>
                <button onClick={() => handleToggle('cumulativeSubscribers')}>
                    {show.cumulativeSubscribers
                        ? 'Hide Cumulative Active Subscribers'
                        : 'View Cumulative Active Subscribers'}
                </button>
                {show.cumulativeSubscribers &&
                    renderTableWithBorders(lists.cumulativeSubscribers, [
                        'Username',
                        'Role',
                        'Created At',
                        'Subscription Date',
                        'Artist ID',
                    ] ,'cumulativeSubscribers', true)}

                <p>Inactive Subscribers: {data.inactiveSubscribers}</p>
                <button onClick={() => handleToggle('inactiveSubscribers')}>
                    {show.inactiveSubscribers ? 'Hide Inactive Subscribers' : 'View Inactive Subscribers'}
                </button>
                {show.inactiveSubscribers &&
                    renderTableWithBorders(lists.inactiveSubscribers, [
                        'Username',
                        'Role',
                        'Created At',
                        'Subscription Date',
                        'Artist ID',
                    ],'inactiveSubscribers', true)}
            </div>
        </div>
    )}
</div>
    );
};

export default AdminReports;
