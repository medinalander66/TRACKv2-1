import { createContext, useContext, useState } from "react";

const TasksFilterContext = createContext();

export const TasksFilterProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ongoing"); // ongoing | completed | missed
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // all | personal | department | campus

  return (
    <TasksFilterContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        visibilityFilter,
        setVisibilityFilter,
      }}
    >
      {children}
    </TasksFilterContext.Provider>
  );
};

export const useTasksFilter = () => useContext(TasksFilterContext);
