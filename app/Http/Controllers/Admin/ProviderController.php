<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProviderController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Providers/Index', [
            'providers' => Provider::withCount('models')->latest()->get()->map(fn (Provider $provider) => [
                'id' => $provider->id,
                'name' => $provider->name,
                'slug' => $provider->slug,
                'type' => $provider->type,
                'base_url' => $provider->base_url,
                'is_active' => (bool) $provider->is_active,
                'has_api_key' => filled($provider->api_key),
                'models_count' => $provider->models_count,
                'created_at' => $provider->created_at?->toISOString(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:120'],
            'slug' => ['required','string','max:80','unique:providers,slug'],
            'base_url' => ['required','url','max:255'],
            'api_key' => ['nullable','string','max:5000'],
        ]);
        $data['type'] = 'openai_compatible';
        Provider::create($data);
        return back();
    }
    public function update(Request $request, Provider $provider)
    {
        $data = $request->validate([
            'name' => ['required','string','max:120'],
            'slug' => ['required','string','max:80', Rule::unique('providers', 'slug')->ignore($provider->id)],
            'base_url' => ['required','url','max:255'],
            'api_key' => ['nullable','string','max:5000'],
            'is_active' => ['required','boolean'],
        ]);

        if (blank($data['api_key'] ?? null)) {
            unset($data['api_key']);
        }

        $provider->update($data);

        return back();
    }
}
