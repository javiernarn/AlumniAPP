<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEventsTable extends Migration
{
    public function up()
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('event_type',30);
            $table->string('category');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('location');
            $table->decimal('price', 10, 2)->default(0);
            $table->integer('capacity');
            $table->string('organizer');
            $table->string('contact_number')->nullable();   // NEW
        $table->string('contact_email')->nullable();    // NEW
            $table->text('tags')->nullable();
            $table->text('agenda')->nullable();
            $table->boolean('featured')->default(false);
            $table->text('images')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('events');
    }
}