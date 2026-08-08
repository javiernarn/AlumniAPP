<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMissingMessagingColumnsAndReactionsTable extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table) {
            if (!Schema::hasColumn('messages', 'sender_id')) {
                $table->unsignedBigInteger('sender_id')->nullable()->after('sender_type');
            }

            if (!Schema::hasColumn('messages', 'image_path')) {
                $table->string('image_path')->nullable()->after('message');
            }

            if (!Schema::hasColumn('messages', 'is_edited')) {
                $table->boolean('is_edited')->default(false)->after('is_read');
            }

            $table->index(['sender_type', 'sender_id']);
        });

        if (!Schema::hasTable('message_reactions')) {
            Schema::create('message_reactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('message_id');
                $table->unsignedBigInteger('user_id');
                $table->enum('user_type', ['admin', 'alumni']);
                $table->string('emoji', 20);
                $table->timestamps();

                $table->foreign('message_id')
                    ->references('id')
                    ->on('messages')
                    ->onDelete('cascade');

                $table->unique(['message_id', 'user_id', 'user_type', 'emoji'], 'unique_message_user_emoji');
                $table->index(['message_id', 'user_type']);
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('message_reactions')) {
            Schema::dropIfExists('message_reactions');
        }

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['sender_type', 'sender_id']);

            if (Schema::hasColumn('messages', 'sender_id')) {
                $table->dropColumn('sender_id');
            }

            if (Schema::hasColumn('messages', 'image_path')) {
                $table->dropColumn('image_path');
            }

            if (Schema::hasColumn('messages', 'is_edited')) {
                $table->dropColumn('is_edited');
            }
        });
    }
}
