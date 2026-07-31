import { createContext, useContext, useState } from "react";

const EventsFilterContext = createContext();

export const EventsFilterProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [duration, setDuration] = useState("all"); // 'all', 'day', 'week', 'month'
  const [eventType, setEventType] = useState("all"); // 'all', 'campus', 'department', 'personal'

  return (
    <EventsFilterContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        duration,
        setDuration,
        eventType,
        setEventType,
      }}
    >
      {children}
    </EventsFilterContext.Provider>
  );
};

export const useEventsFilter = () => useContext(EventsFilterContext);