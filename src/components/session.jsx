import { createContext, useContext, useState, useEffect } from "react";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/check_session", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          console.log("Session Data:", data);  // 🔹 Check if data contains user email
          setUserEmail(data.email);
        } else {
          setUserEmail(null);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setUserEmail(null);
      }
    };

    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ userEmail }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
