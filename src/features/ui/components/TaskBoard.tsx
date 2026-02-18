import { useState, useEffect } from 'react';
import { db } from '../../../firebaseConfig';
import { ref, onValue } from 'firebase/database';

interface Task {
    id: string;
    name: string;
    status: string;
    desc: string;
}

export const TaskBoard = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isOpen, setIsOpen] = useState(true); // Toggle minimize

    useEffect(() => {
        const tasksRef = ref(db, 'gamestate/files');
        return onValue(tasksRef, (snapshot) => {
            const data = snapshot.val() as Record<string, { name?: string; testStatus?: string; description?: string }> | null;
            if (data) {
                // Convert the file list into an array of tasks
                const taskList = Object.entries(data).map(([key, file]) => {
                    const f = file;
                    return {
                        id: key,
                        name: f.name ?? key,
                        status: f.testStatus || 'PENDING',
                        desc: f.description || "Fix the code."
                    };
                });
                setTasks(taskList);
            }
        });
    }, []);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded border border-gray-600 hover:bg-gray-700"
            >
                📋 Tasks
            </button>
        );
    }

    return (
        <div className="absolute top-4 right-4 w-64 bg-gray-900/90 border border-blue-500 rounded-lg p-4 text-white shadow-xl pointer-events-auto">
            <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-blue-400">ECO-RESTORATION TASKS</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                    title="Minimize"
                >
                    _
                </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {tasks.map((task) => (
                    <div key={task.id} className="text-sm border-b border-gray-800 pb-2 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-gray-200">{task.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-700 bg-blue-900/50 text-blue-300`}>
                                ACTIVE
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">{task.desc}</p>
                    </div>
                ))}
            </div>
        </div >
    );
};