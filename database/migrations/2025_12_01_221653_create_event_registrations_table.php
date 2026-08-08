<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('event_id');

            // INSERTED: replace user_id with alumni_id
            $table->unsignedBigInteger('alumni_id');

            $table->timestamp('registration_date')->useCurrent();
            $table->enum('status', ['registered', 'cancelled', 'attended'])
                  ->default('registered');

            $table->timestamps();

            // Foreign keys
            $table->foreign('event_id')
                ->references('id')
                ->on('events')
                ->onDelete('cascade');

            // INSERTED: correct FK for alumni table
            $table->foreign('alumni_id')
                ->references('id')
                ->on('alumni')
                ->onDelete('cascade');

            // Prevent duplicate registrations
            // UPDATED: event_id + alumni_id
            $table->unique(['event_id', 'alumni_id'], 'unique_event_alumni');

            // Indexes
            $table->index('event_id', 'idx_event_registrations_event');
            $table->index('alumni_id', 'idx_event_registrations_alumni');
            $table->index('status', 'idx_event_registrations_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_registrations');
    }
};
