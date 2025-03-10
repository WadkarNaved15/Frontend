const React = require('react');
const { createContext, useState, useEffect } = require('react');
const axios = require('axios').default;
const { getToken, saveToken, deleteToken } = require('../functions/secureStorage');
const { decodeToken } = require('../functions/token'); 

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 

  // Load user from token storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true); // Start loading state
        const accessToken = await getToken('accessToken');
        const refreshToken = await getToken('refreshToken');

        if (accessToken) {
          const decoded = decodeToken(accessToken);
          if (decoded) {
            setIsAuthenticated(true);
            setUser(decoded);
            setLoading(false);
            return;
          }
        }

        // If access token is invalid, try refreshing
        if (refreshToken) {
          try {
            const response = await axios.post(`${process.env.BACKEND_URI}/refresh-token`, { refreshToken });
            const newAccessToken = response.data.accessToken;

            if (newAccessToken) {
              await saveToken('accessToken', newAccessToken);
              const decoded = decodeToken(newAccessToken);
              if (decoded) {
                setUser(decoded);
                setIsAuthenticated(true);
              } else {
                await logout(); // Invalid token → logout
              }
            }
          } catch (error) {
            console.error('Failed to refresh token:', error);
            await logout();
          }
        } else {
          await logout();
        }
      } catch (error) {
        console.error('Error loading user:', error);
        await logout();
      } finally {
        setLoading(false); // Stop loading
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (accessToken, refreshToken) => {
    try {
      await saveToken('accessToken', accessToken);
      await saveToken('refreshToken', refreshToken);
      const decoded = decodeToken(accessToken);
      if (decoded) {
        setUser(decoded);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  // Logout function
  const logout = async () => {
    await deleteToken('accessToken');
    await deleteToken('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <UserContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

module.exports = { UserContext, UserProvider };
