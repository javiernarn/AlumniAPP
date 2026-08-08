<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('alumni_documents', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('alumni_id')->unsigned()->nullable();
            $table->enum('document_type', ['student_id', 'alumni_id', 'government_id', 'diploma', 'transcript']);
            $table->string('file_path');
            $table->string('file_name');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            
            $table->index(['alumni_id', 'document_type']);
            $table->foreign('alumni_id')->references('id')->on('alumni')->unsigned()->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('alumni_documents');
    }
};