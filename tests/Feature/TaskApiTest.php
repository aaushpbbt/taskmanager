<?php

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('tasks page can be rendered', function () {
    $response = $this->get(route('tasks.index'));

    $response->assertOk();
});

test('can retrieve all tasks via api', function () {
    Task::factory()->count(3)->create();

    $response = $this->getJson('/api/tasks');

    $response->assertOk()
        ->assertJsonCount(3);
});

test('can create a task via api', function () {
    $payload = [
        'title' => 'Design new dashboard layout',
        'description' => 'Use shadcn UI components and Tailwind v4',
        'completed' => false,
    ];

    $response = $this->postJson('/api/tasks', $payload);

    $response->assertCreated()
        ->assertJsonFragment([
            'title' => 'Design new dashboard layout',
            'completed' => false,
        ]);

    $this->assertDatabaseHas('tasks', [
        'title' => 'Design new dashboard layout',
    ]);
});

test('can update a task via api', function () {
    $task = Task::factory()->pending()->create();

    $response = $this->putJson("/api/tasks/{$task->id}", [
        'title' => 'Updated task title',
        'completed' => true,
    ]);

    $response->assertOk()
        ->assertJsonFragment([
            'id' => $task->id,
            'title' => 'Updated task title',
            'completed' => true,
        ]);

    $this->assertDatabaseHas('tasks', [
        'id' => $task->id,
        'title' => 'Updated task title',
        'completed' => true,
    ]);
});

test('can delete a task via api', function () {
    $task = Task::factory()->create();

    $response = $this->deleteJson("/api/tasks/{$task->id}");

    $response->assertOk()
        ->assertJson(['message' => 'Task deleted successfully']);

    $this->assertDatabaseMissing('tasks', [
        'id' => $task->id,
    ]);
});
