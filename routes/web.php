<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [TaskController::class, 'index'])->name('home');
Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
Route::get('/tasks/{id}', [TaskController::class, 'findbyId'])->name('tasks.show');
Route::put('/tasks/{id}', [TaskController::class, 'updatebyId'])->name('tasks.update');
Route::delete('/tasks/{id}', [TaskController::class, 'delete'])->name('tasks.destroy');

Route::get('/tasks', function () {
    return Inertia::render('tasks/index');
})->name('tasks.index');
