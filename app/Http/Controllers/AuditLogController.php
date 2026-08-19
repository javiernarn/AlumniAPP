<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuditLogController extends Controller
{
    /**
     * Paginated, filterable audit log listing for the admin Audit Log
     * page. Supports:
     *  - search: matches name or email
     *  - role: admin | alumni | department_head
     *  - action: login | logout
     *  - date_from / date_to: filters on occurred_at (Y-m-d)
     *  - per_page (default 20)
     */
    public function index(Request $request)
    {
        try {
            $query = AuditLog::query()->with(['alumni:id,first_name,last_name,profile_image']);

            if ($search = trim((string) $request->get('search'))) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($role = $request->get('role')) {
                if ($role !== 'all') {
                    $query->where('role', $role);
                }
            }

            if ($action = $request->get('action')) {
                if ($action !== 'all') {
                    $query->where('action', $action);
                }
            }

            if ($dateFrom = $request->get('date_from')) {
                $query->whereDate('occurred_at', '>=', $dateFrom);
            }

            if ($dateTo = $request->get('date_to')) {
                $query->whereDate('occurred_at', '<=', $dateTo);
            }

            $perPage = (int) ($request->get('per_page', 20));
            $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 20;

            $logs = $query->orderByDesc('occurred_at')->paginate($perPage);

            $logs->getCollection()->transform(function (AuditLog $log) {
                return [
                    'id' => $log->id,
                    'name' => $log->name,
                    'email' => $log->email,
                    'role' => $log->role,
                    'role_label' => $this->roleLabel($log->role),
                    'course_code' => $log->course_code,
                    'action' => $log->action,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'alumni_id' => $log->alumni_id,
                    'profile_image_url' => $log->alumni?->profile_image_url,
                    'occurred_at' => optional($log->occurred_at)->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $logs->items(),
                'meta' => [
                    'current_page' => $logs->currentPage(),
                    'last_page' => $logs->lastPage(),
                    'per_page' => $logs->perPage(),
                    'total' => $logs->total(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch audit logs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit logs',
            ], 500);
        }
    }

    /**
     * Small summary block for the top of the Audit Log page: counts for
     * today, this week, currently-known logins vs logouts, etc.
     */
    public function summary()
    {
        try {
            $today = now()->startOfDay();
            $weekStart = now()->startOfWeek();

            return response()->json([
                'success' => true,
                'data' => [
                    'today_logins' => AuditLog::where('action', 'login')->where('occurred_at', '>=', $today)->count(),
                    'week_logins' => AuditLog::where('action', 'login')->where('occurred_at', '>=', $weekStart)->count(),
                    'alumni_logins_today' => AuditLog::where('action', 'login')->where('role', 'alumni')->where('occurred_at', '>=', $today)->count(),
                    'department_head_logins_today' => AuditLog::where('action', 'login')->where('role', 'department_head')->where('occurred_at', '>=', $today)->count(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch audit log summary: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch audit log summary',
            ], 500);
        }
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            'admin' => 'Administrator',
            'alumni' => 'Alumni',
            'department_head' => 'Department Head',
            default => ucfirst(str_replace('_', ' ', $role)),
        };
    }
}
