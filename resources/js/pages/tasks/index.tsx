import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    CheckCircle2,
    Clock,
    Plus,
    Trash2,
    Edit3,
    Search,
    ListTodo,
    AlertCircle,
    Loader2,
    Sun,
    Moon,
    ArrowUpDown,
    X,
    CheckCheck,
    RefreshCw,
    Calendar,
    Sparkles,
    Check,
} from "lucide-react";

export type Task = {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    created_at?: string;
    updated_at?: string;
};

interface IndexProps {
    tasks?: Task[];
}

export default function Index({ tasks: initialTasks }: IndexProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
    const [loading, setLoading] = useState<boolean>(!initialTasks);
    const [error, setError] = useState<string | null>(null);

    // Notification toast state
    const [notification, setNotification] = useState<{
        type: "success" | "error" | "info";
        message: string;
    } | null>(null);

    // Filters and search
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed">("all");
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "title-desc">("newest");

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form states
    const [createTitle, setCreateTitle] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createCompleted, setCreateCompleted] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [submittingCreate, setSubmittingCreate] = useState(false);

    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editCompleted, setEditCompleted] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [submittingEdit, setSubmittingEdit] = useState(false);

    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [submittingDelete, setSubmittingDelete] = useState(false);

    // Dark mode state
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            return document.documentElement.classList.contains("dark");
        }
        return false;
    });

    const showNotification = (
        type: "success" | "error" | "info",
        message: string
    ) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification((prev) => (prev?.message === message ? null : prev));
        }, 4000);
    };

    const toggleTheme = () => {
        const nextDark = !isDarkMode;
        setIsDarkMode(nextDark);
        if (nextDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    // Initialize theme from system or storage
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (
            savedTheme === "dark" ||
            (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
            document.documentElement.classList.add("dark");
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove("dark");
            setIsDarkMode(false);
        }
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<Task[]>("/tasks");
            setTasks(response.data);
        } catch (err: unknown) {
            console.error(err);
            setError("Failed to load tasks. Please try again.");
            showNotification("error", "Could not load tasks from server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialTasks || initialTasks.length === 0) {
            fetchTasks();
        }
    }, []);

    // Toggle task completion (optimistic update)
    const handleToggleComplete = async (task: Task) => {
        const newStatus = !task.completed;

        // Optimistic UI update
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, completed: newStatus } : t))
        );

        try {
            await api.put(`/tasks/${task.id}`, {
                title: task.title,
                description: task.description,
                completed: newStatus,
            });
            showNotification(
                "success",
                newStatus ? `"${task.title}" completed!` : `"${task.title}" marked pending.`
            );
        } catch (err: unknown) {
            console.error(err);
            // Rollback on failure
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === task.id ? { ...t, completed: task.completed } : t
                )
            );
            showNotification("error", "Failed to update task status.");
        }
    };

    // Open Edit Dialog
    const handleOpenEdit = (task: Task) => {
        setTaskToEdit(task);
        setEditTitle(task.title);
        setEditDescription(task.description || "");
        setEditCompleted(task.completed);
        setEditError(null);
        setIsEditOpen(true);
    };

    // Submit Edit
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskToEdit) return;

        if (!editTitle.trim()) {
            setEditError("Task title is required.");
            return;
        }

        setSubmittingEdit(true);
        setEditError(null);

        try {
            const response = await api.put<Task>(`/tasks/${taskToEdit.id}`, {
                title: editTitle.trim(),
                description: editDescription.trim() || null,
                completed: editCompleted,
            });

            const updated = response.data;
            setTasks((prev) =>
                prev.map((t) => (t.id === taskToEdit.id ? { ...t, ...updated } : t))
            );
            setIsEditOpen(false);
            setTaskToEdit(null);
            showNotification("success", "Task updated successfully.");
        } catch (err: unknown) {
            console.error(err);
            setEditError("Failed to update task. Please try again.");
            showNotification("error", "Error saving changes.");
        } finally {
            setSubmittingEdit(false);
        }
    };

    // Open Delete Dialog
    const handleOpenDelete = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteOpen(true);
    };

    // Submit Delete
    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;

        setSubmittingDelete(true);
        try {
            await api.delete(`/tasks/${taskToDelete.id}`);
            setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
            setIsDeleteOpen(false);
            showNotification("success", `"${taskToDelete.title}" was deleted.`);
            setTaskToDelete(null);
        } catch (err: unknown) {
            console.error(err);
            showNotification("error", "Failed to delete task.");
        } finally {
            setSubmittingDelete(false);
        }
    };

    // Create New Task
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createTitle.trim()) {
            setCreateError("Task title is required.");
            return;
        }

        setSubmittingCreate(true);
        setCreateError(null);

        try {
            const response = await api.post<Task>("/tasks", {
                title: createTitle.trim(),
                description: createDescription.trim() || null,
                completed: createCompleted,
            });

            setTasks((prev) => [response.data, ...prev]);
            setCreateTitle("");
            setCreateDescription("");
            setCreateCompleted(false);
            setIsCreateOpen(false);
            showNotification("success", "New task created successfully!");
        } catch (err: unknown) {
            console.error(err);
            setCreateError("Failed to create task. Please check your inputs.");
            showNotification("error", "Failed to create task.");
        } finally {
            setSubmittingCreate(false);
        }
    };

    // Filter and Sort logic
    const filteredTasks = useMemo(() => {
        let list = [...tasks];

        // Search filtering
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    (task.description && task.description.toLowerCase().includes(query))
            );
        }

        // Status tab filtering
        if (filterStatus === "pending") {
            list = list.filter((task) => !task.completed);
        } else if (filterStatus === "completed") {
            list = list.filter((task) => task.completed);
        }

        // Sorting
        list.sort((a, b) => {
            if (sortBy === "newest") {
                return b.id - a.id;
            }
            if (sortBy === "oldest") {
                return a.id - b.id;
            }
            if (sortBy === "title-asc") {
                return a.title.localeCompare(b.title);
            }
            if (sortBy === "title-desc") {
                return b.title.localeCompare(a.title);
            }
            return 0;
        });

        return list;
    }, [tasks, searchQuery, filterStatus, sortBy]);

    // Statistics calculations
    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) => t.completed).length;
    const pendingCount = totalCount - completedCount;
    const completionRate =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
            {/* Top Navigation & App Bar */}
            <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <ListTodo className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold tracking-tight sm:text-xl">
                                    TaskFlow
                                </h1>
                                <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider uppercase">
                                    v1.0
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Modern Task & Productivity Manager
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Refresh Button */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={fetchTasks}
                            title="Refresh tasks"
                            disabled={loading}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>

                        {/* Theme Toggle Button */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={toggleTheme}
                            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {isDarkMode ? (
                                <Sun className="size-4 text-amber-400" />
                            ) : (
                                <Moon className="size-4 text-slate-700" />
                            )}
                        </Button>

                        {/* Primary Add Task Button */}
                        <Button
                            onClick={() => {
                                setCreateTitle("");
                                setCreateDescription("");
                                setCreateCompleted(false);
                                setCreateError(null);
                                setIsCreateOpen(true);
                            }}
                            className="gap-1.5 shadow-sm"
                        >
                            <Plus className="size-4" />
                            <span>New Task</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
                    <div
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-md ${
                            notification.type === "success"
                                ? "border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-100"
                                : notification.type === "error"
                                ? "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20"
                                : "border-border bg-card text-card-foreground"
                        }`}
                    >
                        {notification.type === "success" && (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        )}
                        {notification.type === "error" && (
                            <AlertCircle className="size-4 shrink-0 text-destructive" />
                        )}
                        <span className="text-sm font-medium">{notification.message}</span>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-8">
                    {/* Total Tasks */}
                    <Card className="border-border/60 shadow-xs transition-all hover:border-primary/30">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                                    Total Tasks
                                </CardTitle>
                                <ListTodo className="size-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0">
                            <div className="text-2xl font-bold tracking-tight">
                                {loading ? <Skeleton className="h-7 w-12" /> : totalCount}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Active in your workspace
                            </p>
                        </CardContent>
                    </Card>

                    {/* Pending Tasks */}
                    <Card className="border-border/60 shadow-xs transition-all hover:border-amber-500/30">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                                    Pending
                                </CardTitle>
                                <Clock className="size-4 text-amber-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0">
                            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                                {loading ? <Skeleton className="h-7 w-12" /> : pendingCount}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Requiring action
                            </p>
                        </CardContent>
                    </Card>

                    {/* Completed Tasks */}
                    <Card className="border-border/60 shadow-xs transition-all hover:border-emerald-500/30">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                                    Completed
                                </CardTitle>
                                <CheckCircle2 className="size-4 text-emerald-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0">
                            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {loading ? <Skeleton className="h-7 w-12" /> : completedCount}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Successfully finished
                            </p>
                        </CardContent>
                    </Card>

                    {/* Progress / Completion Rate */}
                    <Card className="border-border/60 shadow-xs transition-all hover:border-primary/30">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                                    Completion
                                </CardTitle>
                                <Sparkles className="size-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold tracking-tight">
                                    {loading ? <Skeleton className="h-7 w-12" /> : `${completionRate}%`}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {completedCount}/{totalCount}
                                </span>
                            </div>
                            {/* Visual Progress Bar */}
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                                    style={{ width: `${completionRate}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search, Filter Tabs & Sort Control Toolbar */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search tasks by title or details..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filters & Sorting */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter segmented buttons */}
                        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
                            <button
                                onClick={() => setFilterStatus("all")}
                                className={`rounded-md px-2.5 py-1.5 transition-all ${
                                    filterStatus === "all"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                All ({totalCount})
                            </button>
                            <button
                                onClick={() => setFilterStatus("pending")}
                                className={`rounded-md px-2.5 py-1.5 transition-all ${
                                    filterStatus === "pending"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Pending ({pendingCount})
                            </button>
                            <button
                                onClick={() => setFilterStatus("completed")}
                                className={`rounded-md px-2.5 py-1.5 transition-all ${
                                    filterStatus === "completed"
                                        ? "bg-background text-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Done ({completedCount})
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ArrowUpDown className="size-3.5 ml-1" />
                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(
                                        e.target.value as
                                            | "newest"
                                            | "oldest"
                                            | "title-asc"
                                            | "title-desc"
                                    )
                                }
                                className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring dark:bg-input/20 cursor-pointer"
                            >
                                <option value="newest" className="bg-popover text-popover-foreground">
                                    Newest first
                                </option>
                                <option value="oldest" className="bg-popover text-popover-foreground">
                                    Oldest first
                                </option>
                                <option value="title-asc" className="bg-popover text-popover-foreground">
                                    Alphabetical (A-Z)
                                </option>
                                <option value="title-desc" className="bg-popover text-popover-foreground">
                                    Alphabetical (Z-A)
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="size-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchTasks}
                            className="border-destructive/30 hover:bg-destructive/10"
                        >
                            Retry
                        </Button>
                    </div>
                )}

                {/* Tasks List Content */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="p-4 border-border/60">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="size-5 rounded-md mt-1" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-2/5" />
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-4 w-1/4" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : filteredTasks.length === 0 ? (
                    /* Empty States */
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-border/80 bg-muted/20">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                            {searchQuery ? (
                                <Search className="size-6" />
                            ) : (
                                <CheckCheck className="size-6" />
                            )}
                        </div>
                        <CardTitle className="text-base font-semibold">
                            {searchQuery
                                ? "No tasks match your search"
                                : filterStatus === "completed"
                                ? "No completed tasks yet"
                                : filterStatus === "pending"
                                ? "No pending tasks! All caught up!"
                                : "No tasks in your workspace"}
                        </CardTitle>
                        <CardDescription className="mt-1.5 max-w-sm text-sm">
                            {searchQuery
                                ? `No results found for "${searchQuery}". Try different search keywords or clear filters.`
                                : filterStatus !== "all"
                                ? `Switch back to the "All" tab or create a new task to get started.`
                                : "Get started by organizing your work. Create your first task to stay productive."}
                        </CardDescription>
                        <div className="mt-5 flex gap-2">
                            {searchQuery ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setSearchQuery("")}
                                    size="sm"
                                >
                                    Clear Search
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        setCreateTitle("");
                                        setCreateDescription("");
                                        setCreateCompleted(false);
                                        setCreateError(null);
                                        setIsCreateOpen(true);
                                    }}
                                    size="sm"
                                    className="gap-1.5"
                                >
                                    <Plus className="size-4" />
                                    <span>Create Task</span>
                                </Button>
                            )}
                        </div>
                    </Card>
                ) : (
                    /* Render Tasks List */
                    <div className="space-y-2.5">
                        {filteredTasks.map((task) => (
                            <Card
                                key={task.id}
                                className={`group/item border-border/70 transition-all duration-200 hover:shadow-md hover:border-primary/40 ${
                                    task.completed
                                        ? "bg-muted/30 dark:bg-muted/10 opacity-80"
                                        : "bg-card"
                                }`}
                            >
                                <div className="flex items-start gap-3.5 p-4 sm:p-5">
                                    {/* Task Checkbox */}
                                    <div className="pt-0.5">
                                        <Checkbox
                                            checked={task.completed}
                                            onCheckedChange={() => handleToggleComplete(task)}
                                            aria-label={`Mark "${task.title}" as ${
                                                task.completed ? "pending" : "completed"
                                            }`}
                                            className="size-5 rounded-md cursor-pointer transition-transform group-hover/item:scale-105"
                                        />
                                    </div>

                                    {/* Task Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3
                                                className={`text-sm sm:text-base font-semibold tracking-tight transition-all ${
                                                    task.completed
                                                        ? "line-through text-muted-foreground"
                                                        : "text-foreground"
                                                }`}
                                            >
                                                {task.title}
                                            </h3>

                                            {/* Status Badge */}
                                            {task.completed ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px]"
                                                >
                                                    <Check className="size-3" />
                                                    Completed
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 text-[11px]"
                                                >
                                                    <Clock className="size-3" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {task.description && (
                                            <p
                                                className={`mt-1 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                                                    task.completed
                                                        ? "text-muted-foreground/80 line-through"
                                                        : "text-muted-foreground"
                                                }`}
                                            >
                                                {task.description}
                                            </p>
                                        )}

                                        {/* Metadata */}
                                        {task.created_at && (
                                            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <Calendar className="size-3" />
                                                <span>
                                                    Added {new Date(task.created_at).toLocaleDateString(undefined, {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleOpenEdit(task)}
                                            title="Edit task"
                                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                        >
                                            <Edit3 className="size-3.5" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleOpenDelete(task)}
                                            title="Delete task"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Task Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Plus className="size-4 text-primary" />
                            Create New Task
                        </DialogTitle>
                        <DialogDescription>
                            Add a new task to your workspace. Fill in the title and optional description.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateTask} className="space-y-4 py-2">
                        {createError && (
                            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{createError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label
                                htmlFor="create-task-title"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                                Title <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="create-task-title"
                                autoFocus
                                placeholder="e.g., Finalize project roadmap"
                                value={createTitle}
                                onChange={(e) => setCreateTitle(e.target.value)}
                                disabled={submittingCreate}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="create-task-desc"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                                Description (Optional)
                            </label>
                            <Textarea
                                id="create-task-desc"
                                placeholder="Add extra notes, links, or context for this task..."
                                rows={3}
                                value={createDescription}
                                onChange={(e) => setCreateDescription(e.target.value)}
                                disabled={submittingCreate}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                                id="create-task-completed"
                                checked={createCompleted}
                                onCheckedChange={(val) => setCreateCompleted(val === true)}
                                disabled={submittingCreate}
                            />
                            <label
                                htmlFor="create-task-completed"
                                className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                Mark as already completed
                            </label>
                        </div>

                        <DialogFooter className="mt-4 gap-2 pt-2 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                                disabled={submittingCreate}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingCreate} className="gap-1.5">
                                {submittingCreate ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Task</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Task Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Edit3 className="size-4 text-primary" />
                            Edit Task
                        </DialogTitle>
                        <DialogDescription>
                            Make changes to your task details below and save when done.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
                        {editError && (
                            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{editError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label
                                htmlFor="edit-task-title"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                                Title <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="edit-task-title"
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                disabled={submittingEdit}
                                className="h-9"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="edit-task-desc"
                                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                            >
                                Description (Optional)
                            </label>
                            <Textarea
                                id="edit-task-desc"
                                placeholder="Add extra notes..."
                                rows={3}
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                disabled={submittingEdit}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                                id="edit-task-completed"
                                checked={editCompleted}
                                onCheckedChange={(val) => setEditCompleted(val === true)}
                                disabled={submittingEdit}
                            />
                            <label
                                htmlFor="edit-task-completed"
                                className="text-xs font-medium text-muted-foreground cursor-pointer select-none"
                            >
                                Task completed
                            </label>
                        </div>

                        <DialogFooter className="mt-4 gap-2 pt-2 sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                                disabled={submittingEdit}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submittingEdit} className="gap-1.5">
                                {submittingEdit ? (
                                    <>
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-1">
                            <Trash2 className="size-5" />
                        </div>
                        <DialogTitle className="text-base">Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">
                                "{taskToDelete?.title}"
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4 gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={submittingDelete}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDelete}
                            disabled={submittingDelete}
                            className="gap-1.5"
                        >
                            {submittingDelete ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <span>Delete Task</span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}