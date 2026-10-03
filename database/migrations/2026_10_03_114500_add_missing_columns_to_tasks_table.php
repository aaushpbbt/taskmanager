<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            if (! Schema::hasColumn('tasks', 'title')) {
                $table->string('title')->default('');
            }

            if (! Schema::hasColumn('tasks', 'description')) {
                $table->text('description')->nullable();
            }

            if (! Schema::hasColumn('tasks', 'completed')) {
                $table->boolean('completed')->default(false);
            }
        });
    }

    public function down(): void
    {
        // Existing task data and columns are preserved on rollback.
    }
};
