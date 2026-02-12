import { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';

export const TaskBoard = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(true); // Toggle minimize

    useEffect(() => {
        const tasksRef = ref(db, 'gamestate/files');
        return onValue(tasksRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert the file list into an array of tasks
                const taskList = Object.entries(data).map(([key, file]: [string, any]) => ({
                    id: key,
                    name: file.name,
                    status: file.testStatus || 'PENDING', // PENDING, PASS, FAIL
                    desc: file.description || "Fix the code."
                }));
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
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${task.status === 'PASS' ? 'bg-green-900/50 text-green-300 border-green-700' :
                                task.status === 'FAIL' ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
                                }`}>
                                {task.status}
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed">{task.desc}</p>
                    </div>
                ))}
            </div>
        </div >
    );
};