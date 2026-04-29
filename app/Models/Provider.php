<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provider extends Model
{
    protected $fillable = ['name','slug','type','base_url','api_key','is_active','metadata'];
    protected $casts = ['api_key' => 'encrypted', 'is_active' => 'boolean', 'metadata' => 'array'];
    protected $hidden = ['api_key'];
    public function models(): HasMany { return $this->hasMany(AiModel::class); }
}
