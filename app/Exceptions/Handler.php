<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * Alumni, admins, and department heads all consume this API through the
     * same React toast/notification layer (see resources/js/utils/axiosConfig.js),
     * which shows whatever is in `message` verbatim. Left to Laravel's default
     * behaviour, most unhandled exceptions in production collapse into a bare
     * "Server Error" with no context, which is exactly the confusing generic
     * toast this override replaces with a specific, human-readable message —
     * one per failure type, without leaking stack traces or SQL to the client.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $e)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->renderApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Build a consistent, specific JSON error payload for API requests.
     */
    protected function renderApiException(Request $request, Throwable $e)
    {
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid. Please check the highlighted fields and try again.',
                'errors' => $e->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'You need to be logged in to do that. Please log in and try again.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($e instanceof AuthorizationException) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($e instanceof ModelNotFoundException) {
            $model = class_basename($e->getModel());

            return response()->json([
                'success' => false,
                'message' => "The requested {$this->humanizeModelName($model)} could not be found. It may have been deleted or moved.",
            ], Response::HTTP_NOT_FOUND);
        }

        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource could not be found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($e instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'This action is not supported for that request.',
            ], Response::HTTP_METHOD_NOT_ALLOWED);
        }

        if ($e instanceof TooManyRequestsHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please slow down and try again shortly.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        if ($e instanceof QueryException) {
            // Never echo raw SQL or bindings back to the client — just tell
            // them plainly that a database operation failed.
            return response()->json([
                'success' => false,
                'message' => 'A database error occurred while processing your request. Please try again, and contact support if the problem persists.',
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: $this->genericMessageForStatus($status),
            ], $status);
        }

        // Anything else is an unhandled server-side failure. In debug mode,
        // surface the real exception message to help development; in
        // production, keep it generic so internals never leak to the browser.
        return response()->json([
            'success' => false,
            'message' => config('app.debug')
                ? $e->getMessage()
                : 'Something went wrong on our end. Please try again, and contact support if it keeps happening.',
        ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }

    /**
     * Turn a model class name like "AlumniProfile" into "alumni profile" for
     * use in a sentence.
     */
    protected function humanizeModelName(string $model): string
    {
        return strtolower(trim(preg_replace('/(?<!^)[A-Z]/', ' $0', $model)));
    }

    /**
     * Fallback copy for HTTP exceptions that don't carry their own message.
     */
    protected function genericMessageForStatus(int $status): string
    {
        return match (true) {
            $status === 400 => 'That request could not be processed. Please check your input and try again.',
            $status === 403 => "You don't have permission to perform this action.",
            $status === 404 => 'The requested resource could not be found.',
            $status === 409 => 'This action conflicts with existing data. Please refresh and try again.',
            $status >= 500 => 'Something went wrong on our end. Please try again shortly.',
            default => 'An unexpected error occurred.',
        };
    }
}