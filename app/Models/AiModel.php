<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiModel extends Model
{
    protected $fillable = ['provider_id','model_id','display_name','category','context_window','supports_streaming','supports_vision','supports_files','input_price','output_price','is_default','is_latest','is_active','metadata'];
    protected $casts = ['supports_streaming'=>'boolean','supports_vision'=>'boolean','supports_files'=>'boolean','is_default'=>'boolean','is_latest'=>'boolean','is_active'=>'boolean','metadata'=>'array'];
    public function provider(): BelongsTo { return $this->belongsTo(Provider::class); }
    public function chatSessions(): HasMany { return $this->hasMany(ChatSession::class); }
}
