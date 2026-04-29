<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ChatSession extends Model
{
    protected $fillable = ['uuid','user_id','ai_model_id','title','system_prompt','metadata'];
    protected $casts = ['metadata'=>'array'];

    protected static function booted(): void
    {
        static::creating(function (ChatSession $chat) {
            $chat->uuid ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function aiModel(): BelongsTo { return $this->belongsTo(AiModel::class); }
    public function messages(): HasMany { return $this->hasMany(Message::class); }
}
