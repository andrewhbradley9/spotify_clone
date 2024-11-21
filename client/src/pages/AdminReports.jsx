import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
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


const AdminReports = () => {
    const [accountStatusFilter, setAccountStatusFilter] = useState('Both');
    const dropdownRef = useRef(null); 
    const navigate = useNavigate();
    const [loadingUserAction, setLoadingUserAction] = useState(null); // Tracks the user ID being processed
    const usernameDropdownRef = useRef(null); // Username dropdownyyy
    const [dateRange, setDateRange] = useState(getCurrentMonthRange());
    const [roleFilter, setRoleFilter] = useState('any'); // Role filter
    const [searchQuery, setSearchQuery] = useState('');
    const [roleDropdownPosition, setRoleDropdownPosition] = useState({ x: 0, y: 0 });
    const [usernameDropdownPosition, setUsernameDropdownPosition] = useState({ x: 0, y: 0 });
    const [isAllUsersChecked, setIsAllUsersChecked] = useState(false);
    const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('Both');
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
            const res = await axios.get(`${apiUrl}/artists/all/${endpoint}`, { params });
            setter(res.data);
        } catch (err) {
            console.error(`Error fetching ${endpoint}:`, err.response?.data || err.message);
        }
    };
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                usernameDropdownRef.current && !usernameDropdownRef.current.contains(event.target)
            ) {
                // Close all dropdowns if the click is outside
                setUsernameDropdown(null);
                setRoleDropdownVisible(false);
            }
        };
    
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);
    
    useEffect(() => {
        const fetchReports = async () => {
            await fetchData('users', { startDate: dateRange.startDate, endDate: dateRange.endDate }, (data) => {
                setData((prev) => ({
                    ...prev,
                    totalUsers: data.total_users || 0,
                    users: data.users || [], // Ensure account_status is in data.users
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
        const params = { endDate: dateRange.endDate, mode: key === 'inactiveSubscribers' ? 'inactive' : 'cumulative' };
        if (!show[key]) {
            fetchData('subscribers', params, (data) =>
                setLists((prev) => ({
                    ...prev,
                    [key]: key === 'inactiveSubscribers' ? data.inactive_subscribers || [] : data.users || [],
                }))
            );
        }
        setShow((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleDateChange = (key, value) => setDateRange((prev) => ({ ...prev, [key]: value }));
    const handleSort = (field) => {
        const key = isAllUsersChecked ? 'allUsers' : 'users'; // Determine the correct key dynamically
        const dataset = data[key];
    
        if (!dataset || !Array.isArray(dataset)) {
            console.error(`The data for key "${key}" is not iterable or invalid.`);
            return;
        }
    
        const order = sortOrder[key] === 'asc' ? 'desc' : 'asc'; // Toggle sort order
        setSortOrder((prev) => ({ ...prev, [key]: order }));
    
        const sortedList = [...dataset].sort((a, b) => {
            if (a[field] && b[field]) {
                return order === 'asc' ? a[field].localeCompare(b[field]) : b[field].localeCompare(a[field]);
            }
            return 0; // Default if field is missing
        });
    
        setData((prev) => ({ ...prev, [key]: sortedList })); // Update the sorted data
    };
    const handleRoleFilterChange = (role) => {
        console.log('Selected role:', role); // Debugging log
        setRoleFilter(role); // Update the role filter
        setRoleDropdownVisible(false); // Close the dropdown
    };
    
    const handleAccountStatusToggle = () => {
        setAccountStatusFilter((prev) => {
            if (prev === 'Both') return 'Active';
            if (prev === 'Active') return 'Deactive';
            return 'Both';
        });
    };
    
    const handleSubscriptionStatusToggle = () => {
        setSubscriptionStatusFilter((prev) => {
            if (prev === 'Both') return 'Active';
            if (prev === 'Active') return 'Inactive';
            return 'Both';
        });
    };
    const filteredData = (list) =>
        list
            .filter((item) =>
                roleFilter === 'any' || (item.role && item.role.toLowerCase() === roleFilter)
            )
            .filter((item) =>
                searchQuery
                    ? item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.artist_id && item.artist_id.toString().includes(searchQuery))
                    : true
            )
            .filter((item) => {
                if (subscriptionStatusFilter === 'Active') {
                    return item.subscription_date && new Date(item.subscription_date) <= new Date(dateRange.endDate);
                }
                if (subscriptionStatusFilter === 'Inactive') {
                    return !item.subscription_date || new Date(item.subscription_date) > new Date(dateRange.endDate);
                }
                return true; // Both
            })
            .filter((item) => {
                if (accountStatusFilter === 'Active') return item.account_status === 'active';
                if (accountStatusFilter === 'Deactive') return item.account_status === 'deactive';
                return true; // Both
            });
    
            const toggleUsernameDropdown = (userId, event) => {
                const rect = event.target.getBoundingClientRect();
                setUsernameDropdownPosition({
                    x: rect.left + window.scrollX,
                    y: rect.bottom + window.scrollY,
                });
                setUsernameDropdown((prev) => (prev === userId ? null : userId)); // Toggle dropdown
            };
    const handleCheckboxToggle = () => setIsAllUsersChecked((prev) => !prev);
    const handleDeleteUser = async (userId, username) => {
        const isConfirmed = window.confirm(
            `Are you sure you want to delete the user "${username}"? This will delete all associated data!`
        );
    
        if (isConfirmed) {
            try {
                await axios.delete(`${apiUrl}/artists/user/${userId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                alert(`User "${username}" and all associated data have been deleted.`);
                // Refresh the data
                setData((prev) => ({
                    ...prev,
                    users: prev.users.filter((user) => user.user_id !== userId),
                    allUsers: prev.allUsers.filter((user) => user.user_id !== userId),
                }));
            } catch (err) {
                console.error('Error deleting user:', err);
                alert('Failed to delete user. Please try again.');
            }
        }
    };
    
    const handleDeactivateUser = async (userId, username) => {
        const isConfirmed = window.confirm(
            `Are you sure you want to deactivate the user "${username}"? This will disable login but keep all data intact.`
        );
    
        if (isConfirmed) {
            setLoadingUserAction(userId); // Set the user ID being processed
            try {
                await axios.patch(
                    `${apiUrl}/users/${userId}/deactivate`,
                    {}, // No payload required for this action
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }
                );
                alert(`User "${username}" has been deactivated.`);
                setData((prev) => ({
                    ...prev,
                    users: prev.users.map((user) =>
                        user.user_id === userId
                            ? { ...user, account_status: 'inactive', subscription_date: null }
                            : user
                    ),
                    allUsers: prev.allUsers.map((user) =>
                        user.user_id === userId
                            ? { ...user, account_status: 'inactive', subscription_date: null }
                            : user
                    ),
                }));
            } catch (err) {
                console.error('Error deactivating user:', err);
                alert('Failed to deactivate user. Please try again.');
            } finally {
                setLoadingUserAction(null); // Reset after the action is complete
            }
        }
    };
    const handleActivateUser = async (userId, username) => {
        const isConfirmed = window.confirm(
            `Are you sure you want to activate the user "${username}"? This will re-enable login access.`
        );
    
        if (isConfirmed) {
            setLoadingUserAction(userId); // Set the user ID being processed
            try {
                await axios.patch(
                    `${apiUrl}/users/${userId}/activate`, // Replace with your activation endpoint
                    {}, // No payload required for this action
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    }
                );
                alert(`User "${username}" has been activated.`);
                setData((prev) => ({
                    ...prev,
                    users: prev.users.map((user) =>
                        user.user_id === userId
                            ? { ...user, account_status: 'active' }
                            : user
                    ),
                    allUsers: prev.allUsers.map((user) =>
                        user.user_id === userId
                            ? { ...user, account_status: 'active' }
                            : user
                    ),
                }));
            } catch (err) {
                console.error('Error activating user:', err);
                alert('Failed to activate user. Please try again.');
            } finally {
                setLoadingUserAction(null); // Reset after the action is complete
            }
        }
    };
    

    const renderTableWithBorders = (list, headers) => (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        {headers.map((header) => {
                            const isSortable = header === 'Username'; // Set sortable headers
                            const isRoleColumn = header === 'Role'; // Identify the Role column
                            return (
                                <th
                                    key={header}
                                    onClick={
                                        header === 'Subscription Status'
                                            ? handleSubscriptionStatusToggle // Handle click for Subscription Status
                                            : header === 'Account Status'
                                            ? handleAccountStatusToggle
                                            : isSortable
                                            ? () => handleSort('username') // Handle sorting for Username
                                            : null
                                    }
                                    style={{
                                        position: 'relative',
                                        cursor:
                                            header === 'Subscription Status' || header === 'Account Status' || isSortable || isRoleColumn
                                                ? 'pointer'
                                                : 'default',
                                        textDecoration:
                                            header === 'Subscription Status' || header === 'Account Status' || isSortable || isRoleColumn
                                                ? 'underline'
                                                : 'none',
                                    }}
                                >
                                    {header}
                                    {header === 'Account Status' && ` (${accountStatusFilter})`}
                                    {header === 'Subscription Status' && ` (${subscriptionStatusFilter})`}
                                    {isRoleColumn && (
                                        <span
                                        style={{
                                            marginLeft: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: 'black',
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRoleDropdownVisible((prev) => !prev);
                                            setRoleDropdownPosition({ x: e.clientX, y: e.clientY });
                                        }}
                                    >
                                        ⬇
                                    </span>
                                    )}
                                    {isRoleColumn && roleDropdownVisible &&
                                        ReactDOM.createPortal(
                                            <div
                                                className="dropdown-menu"
                                                style={{
                                                    position: 'absolute',
                                                    top: `${roleDropdownPosition.y}px`,
                                                    left: `${roleDropdownPosition.x}px`,
                                                    backgroundColor: 'white',
                                                    border: '1px solid #ccc',
                                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                                    zIndex: 1000,
                                                    minWidth: '150px',
                                                    borderRadius: '4px',
                                                    padding: '5px',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                            {['Any', 'Admin', 'Artist', 'Listener'].map((role) => (
                                                <div
                                                    key={role}
                                                    style={{
                                                        padding: '5px',
                                                        cursor: 'pointer',
                                                        color: '#7baeb0',
                                                    }}
                                                    onClick={() => handleRoleFilterChange(role.toLowerCase())} // Lowercase the filter value
                                                >
                                                    {role}
                                                </div>
                                            ))}


                                            </div>,
                                            document.body // Render outside the table container
                                        )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {filteredData(list).length === 0 ? (
                        <tr>
                            <td colSpan={headers.length} style={{ textAlign: 'center', color: 'gray' }}>
                                No users found
                            </td>
                        </tr>
                    ) : (
                        filteredData(list).map((item) => (
                            <tr key={item.user_id}>
                                <td className="username-cell">
                                    {item.artist_id ? (
                                        <div style={{ position: 'relative', cursor: 'pointer' }}>
                                            <span onClick={(e) => toggleUsernameDropdown(item.user_id, e)}>
                                                {item.username}
                                            </span>
                                            {usernameDropdown === item.user_id &&
                                                ReactDOM.createPortal(
                                                    <div
                                                        className="username-dropdown"
                                                        style={{
                                                            position: 'absolute',
                                                            top: `${usernameDropdownPosition.y}px`,
                                                            left: `${usernameDropdownPosition.x}px`,
                                                            backgroundColor: 'white',
                                                            border: '1px solid #ccc',
                                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                                            zIndex: 1000,
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
                                                                window.open(`/artist/${item.artist_id}`, '_blank')
                                                            }
                                                        >
                                                            View Artist Profile
                                                        </div>
                                                        <div
                                                            style={{
                                                                padding: '5px',
                                                                cursor: 'pointer',
                                                                color: '#7baeb0',
                                                            }}
                                                            onClick={() =>
                                                                window.open(
                                                                    `/ArtistReports?artist_id=${item.artist_id}`,
                                                                    '_blank'
                                                                )
                                                            }
                                                        >
                                                            View Artist Report
                                                        </div>
                                                    </div>,
                                                    document.body // Render outside the table container
                                                )}
                                        </div>
                                    ) : (
                                        item.username
                                    )}
                                </td>
                                <td>{item.user_id || 'N/A'}</td>
                                <td>{item.role || 'N/A'}</td>
                                <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                                <td>{item.subscription_date ? new Date(item.subscription_date).toLocaleDateString() : 'None'}</td>
                                <td>{item.artist_id || 'None'}</td>
                                <td>
                                    {item.subscription_date &&
                                    new Date(item.subscription_date) <= new Date(dateRange.endDate)
                                        ? 'Active'
                                        : 'Inactive'}
                                </td>
                                <td>
                                {item.account_status === 'active' ? (
                                    <button
                                        style={{
                                            backgroundColor: 'green',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            padding: '5px 10px',
                                        }}
                                        onClick={() => handleDeactivateUser(item.user_id, item.username)}
                                    >
                                        ✓ Active
                                    </button>
                                ) : (
                                    <button
                                        style={{
                                            backgroundColor: 'red',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            padding: '5px 10px',
                                        }}
                                        onClick={() => handleActivateUser(item.user_id, item.username)}
                                    >
                                        X Deactive
                                    </button>
                                )}
                                <button
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '5px',
                                }}
                                onClick={() => handleDeleteUser(item.user_id, item.username)} // Attach delete logic
                                title="Delete User"
                            >
                                🗑️
                            </button>
                            </td>

                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
     

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

            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
    <div>
        <label>
            Start Date:
            <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
            />
        </label>
    </div>
    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <label style={{ marginBottom: '10px' }}>
            End Date:
            <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
            />
        </label>
        <button
            onClick={() => {
                // Reset filters
                setDateRange(getCurrentMonthRange()); // Reset to current month range
                setSearchQuery(''); // Clear search query
                setRoleFilter('any'); // Reset role filter
                setSubscriptionStatusFilter('Both'); // Reset subscription status filter
                setIsAllUsersChecked(false); // Uncheck "Include Total Users" checkbox
            }}
            style={{
                marginTop: '10px',
                padding: '5px 15px',
                backgroundColor: '#008CBA',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
            }}
        >
            Reset Filters
        </button>
    </div>
</div>

        <div>
            <h2>User Report</h2>
            <label>
                        <input
                            type="checkbox"
                            checked={isAllUsersChecked}
                            onChange={handleCheckboxToggle}
                        />
                        Include Total Users (not within date frames)
                        </label>
                    {renderTableWithBorders(
                        isAllUsersChecked ? data.allUsers : data.users,
                        ['Username', 'User ID', 'Role', 'Created At', 'Subscription Date', 'Artist ID', 'Subscription Status','Account Status']
                    ,'allUsers', 'users')}
                </div>

        </div>
    )};

export default AdminReports;