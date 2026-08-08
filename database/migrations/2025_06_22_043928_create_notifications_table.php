<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The user who receives the notification
            $table->string('notifiable_type',30); // e.g., 'message', 'comment', 'like'
            $table->text('data')->nullable(); // Store extra data as JSON or text
            $table->boolean('read')->default(false); // Whether the notification has been read
            $table->timestamp('read_at')->nullable(); // When the notification was read
            $table->timestamps(); // created_at and updated_at
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notifications');
    }
}
