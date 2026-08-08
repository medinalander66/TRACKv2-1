import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/client";
import CreateTask from "./CreateTask";

export default function EditTask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [taskData, setTaskData] = useState(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await apiClient.get(`/tasks/${id}`);
        if (res.data.ok) {
          setTaskData(res.data.task);
        } else {
          navigate("/tasks");
        }
      } catch (err) {
        navigate("/tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!taskData) return null;
}
