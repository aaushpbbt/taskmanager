<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TaskController;

Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::get('/tasks/{id}', [TaskController::class, 'findbyId']);
Route::put('/tasks/{id}', [TaskController::class, 'updatebyId']);
Route::delete('/tasks/{id}', [TaskController::class, 'delete']);

