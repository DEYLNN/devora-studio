<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsageLog extends Model
{
    public function provider() { return $this->belongsTo(Provider::class); }
    public function aiModel() { return $this->belongsTo(AiModel::class); }
    protected $fillable = ['user_id','provider_id','ai_model_id','chat_session_id','prompt_tokens','completion_tokens','total_tokens','cost_estimate','status','path','status_code','error','metadata'];
    protected $casts = ['metadata'=>'array'];
}
