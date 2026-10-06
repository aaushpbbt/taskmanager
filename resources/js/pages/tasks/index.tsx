import { useEffect, useState } from "react";
import api from "@/lib/axios";

type Task = {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
};

export default function Index() {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        api.get("/tasks")
            .then((response) => {
                setTasks(response.data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    return (
        <div>
            <h1>Tasks</h1>

            {tasks.map((task) => (
                <div key={task.id}>
                    <h2>{task.title}</h2>
                    <p>{task.description}</p>

                    <p>
                        {task.completed
                            ? "Completed"
                            : "Pending"}
                    </p>
                </div>
            ))}
        </div>
    );
}