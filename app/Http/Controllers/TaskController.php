<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index()
    {
        $tasks = Task::all();

        return response()->json($tasks, 200);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'nullable|boolean',
        ]);

        $task = Task::create($validatedData);

        return response()->json($task, 201);
    }

    public function delete($id)
    {
        $task = Task::find($id);
        if ($task) {
            $task->delete();

            return response()->json(['message' => 'Task deleted successfully'], 200);
        }

        return response()->json(['message' => 'Task not found'], 404);
    }

    public function findbyId($id)
    {
        $task = Task::find($id);
        if ($task) {
            return response()->json($task, 200);
        }

        return response()->json(['message' => 'Task not found'], 404);
    }

    public function updatebyId($id, Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'nullable|boolean',
        ]);

        $task = Task::find($id);
        if ($task) {
            $task->update($validatedData);

            return response()->json($task, 200);
        }

        return response()->json(['message' => 'Task not found'], 404);
    }
}
