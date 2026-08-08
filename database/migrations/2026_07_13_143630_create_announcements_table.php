<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();

            // Content
            $table->string('title');
            $table->text('content');
            $table->string('category', 50)->default('general');
            // general | academic | event | career | urgent | maintenance | other

            // Publishing controls
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('pinned')->default(false);
            $table->date('publish_date')->nullable();   // when it should start showing
            $table->date('expiry_date')->nullable();    // when it should stop showing (optional)

            // Media
            $table->json('images')->nullable();

            // Ownership / stats
            $table->unsignedBigInteger('user_id')->nullable(); // admin who created it
            $table->unsignedInteger('views_count')->default(0);

            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('announcements');
    }
};