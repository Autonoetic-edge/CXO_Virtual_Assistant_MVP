import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  CheckCircle, Circle, Plus, Trash2, Calendar, Clock, Flag,
  ChevronDown, ChevronRight, Filter, Search, AlertTriangle
} from 'lucide-react';
import { taskService } from '../services/taskService';

const PRIORITY_COLORS = {
  urgent: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-blue-600 bg-blue-50',
  low: 'text-gray-600 bg-gray-50',
};

const PRIORITY_ICONS = {
  urgent: '🔴',
  high: '🟠',
  medium: '🔵',
  low: '⚪',
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '', list_name: '' });
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lists, setLists] = useState(['default']);
  const [showOverdue, setShowOverdue] = useState(true);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    due_time: '',
    list_name: 'default',
    category: '',
  });

  useEffect(() => {
    loadTasks();
    loadLists();
    loadOverdue();
  }, [filter]);

  const loadTasks = async () => {
    try {
      const response = await taskService.getTasks(filter);
      setTasks(response.data || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async () => {
    try {
      const response = await taskService.getLists();
      setLists(response.data || ['default']);
    } catch (error) {
      console.error('Failed to load lists:', error);
    }
  };

  const loadOverdue = async () => {
    try {
      const response = await taskService.getOverdue();
      setOverdueTasks(response.data || []);
    } catch (error) {
      console.error('Failed to load overdue tasks:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    try {
      await taskService.createTask(newTask);
      toast.success('Task added!');
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        due_time: '',
        list_name: 'default',
        category: '',
      });
      setShowAddTask(false);
      loadTasks();
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await taskService.completeTask(taskId);
      toast.success('Task completed!');
      loadTasks();
      loadOverdue();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted');
      loadTasks();
      loadOverdue();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const list = task.list_name || 'default';
    if (!acc[list]) acc[list] = [];
    acc[list].push(task);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => setShowAddTask(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          />
        </div>

        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowOverdue(!showOverdue)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={18} />
              <span className="font-medium">Overdue Tasks ({overdueTasks.length})</span>
            </div>
            {showOverdue ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {showOverdue && (
            <div className="border-t border-red-200 p-4 space-y-2">
              {overdueTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  formatDate={formatDate}
                  isOverdue
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Lists */}
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Circle size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tasks found. Add your first task to get started!</p>
        </div>
      ) : (
        Object.entries(groupedTasks).map(([listName, listTasks]) => (
          <div key={listName} className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-700 capitalize">{listName}</h2>
            </div>
            <div className="divide-y">
              {listTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  formatDate={formatDate}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Add New Task</h2>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List</label>
                  <select
                    value={newTask.list_name}
                    onChange={(e) => setNewTask({ ...newTask, list_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  >
                    {lists.map((list) => (
                      <option key={list} value={list}>
                        {list}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={newTask.due_time}
                    onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskItem = ({ task, onComplete, onDelete, formatDate, isOverdue }) => {
  const isCompleted = task.status === 'completed';

  return (
    <div
      className={`flex items-start gap-4 p-4 hover:bg-gray-50 transition ${
        isOverdue ? 'bg-red-25' : ''
      }`}
    >
      <button
        onClick={() => !isCompleted && onComplete(task.id)}
        className={`mt-1 flex-shrink-0 ${isCompleted ? 'text-green-500' : 'text-gray-400 hover:text-primary'}`}
      >
        {isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-sm text-gray-500 mt-1 truncate">{task.description}</div>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm">
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar size={14} />
              {formatDate(task.due_date)}
            </span>
          )}
          {task.due_time && (
            <span className="flex items-center gap-1 text-gray-500">
              <Clock size={14} />
              {task.due_time}
            </span>
          )}
          {task.external_source && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
              {task.external_source}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded ${PRIORITY_COLORS[task.priority]}`}>
          {PRIORITY_ICONS[task.priority]} {task.priority}
        </span>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Tasks;
