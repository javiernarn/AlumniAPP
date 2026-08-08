<?php

namespace App\Events;

// use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class MessageSent implements ShouldBroadcast
{
    public $id;
    public $class_id;
    public $class_slug;
    public $title;
    public $user_id;
    public $message;
    public $time;
    public $className;
    public $type;

    public function __construct($data)
    {
    
        $this->id = $data['id'] ?? null;
        $this->class_id = $data['class_id'] ?? null;
        $this->class_slug = $data['class_slug'] ?? null;
        $this->title = $data['title'] ?? 'New Notification';
        $this->user_id = $data['user_id'] ?? null;
        $this->message = $data['message'] ?? null;
        $this->className = $data['className'] ?? null;
        $this->time = $data['time'] ?? now()->toDateTimeString();
        $this->type = $data['type'] ?? null;
    }

    public function broadcastOn()
    {
        // Private channel for user ID 3 (or dynamic)
        return new Channel('public-user.208');
        // For dynamic user channels:
        // return new Channel('public-user.'.$this->user_id);
    }

    public function broadcastAs()
    {
        return 'private-message';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'class_slug' => $this->class_slug,
            'title' => $this->title,
            'user_id' => $this->user_id,
            'message' => $this->message,
            'className' => $this->className,
            'time' => $this->time,
            'type' => $this->type
        ];
    }
}
