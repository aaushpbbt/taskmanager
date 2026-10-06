<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::get('/tasks/{id}', [TaskController::class, 'findbyId']);
Route::put('/tasks/{id}', [TaskController::class, 'updatebyId']);
Route::delete('/tasks/{id}', [TaskController::class, 'delete']);

Route::get('/tasks', function () {
    return Inertia::render('tasks/index');
});
