<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = ['chat_session_id','role','content','token_input','token_output','metadata'];
    protected $casts = ['metadata'=>'array'];
    public function chatSession(): BelongsTo { return $this->belongsTo(ChatSession::class); }
}
