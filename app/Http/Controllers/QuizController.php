<?php
// app/Http/Controllers/QuizController.php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Quiz;
use App\Models\AlumniQuiz;
use Illuminate\Http\Request;
use App\Models\AlumniQuizQuestion;
use App\Http\Requests\StoreQuizRequest;
use App\Http\Requests\UpdateQuizOrderRequest;
use App\Models\Notification;
use App\Models\User;


class QuizController extends Controller
{
    public function index(Request $request)
    {
        $quizzes = Quiz::with(['user', 'questions'])
            // ->where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($quizzes);
    }

    public function store(StoreQuizRequest $request)
    {
        $questionsString = $request->questions;
        $questionIds = explode(',', $questionsString);
        try {
            // Create quiz
            $quiz = Quiz::create([
                'title' => $request->title,
                'description' => $request->description,
                'type' => $request->type,
                'user_id' => auth()->id(),
            ]);

            // Attach questions with order
            foreach ($questionIds as $index => $questionId) {
                $quiz->questions()->attach($questionId, [
                    'display_order' => $index + 1
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Quiz created successfully!',
                'data' => $quiz->load(['user', 'questions'])
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Please add first the Question atleast 1'
            ], 500);
        }
    }

    public function show(Quiz $quiz)
    {
        // Authorization
        if ($quiz->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $quiz->load(['user', 'questions.user'])
        ]);
    }

    public function update(StoreQuizRequest $request, Quiz $quiz)
    {
        // Authorization
        if ($quiz->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Update quiz details
            $quiz->update([
                'title' => $request->title,
                'description' => $request->description,
            ]);

            // Sync questions with new order
            $quiz->questions()->detach();

            foreach ($request->questions as $index => $questionId) {
                $quiz->questions()->attach($questionId, [
                    'display_order' => $index + 1
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Quiz updated successfully!',
                'data' => $quiz->load(['user', 'questions'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quiz: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Quiz $quiz)
    {
        // Authorization
        if ($quiz->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            $quiz->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quiz deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete quiz: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateOrder(UpdateQuizOrderRequest $request, Quiz $quiz)
    {
        // Authorization
        if ($quiz->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            $quiz->reorderQuestions($request->questions);

            return response()->json([
                'success' => true,
                'message' => 'Quiz order updated successfully!',
                'data' => $quiz->load(['user', 'questions'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quiz order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function duplicate(Quiz $quiz)
    {
        // Authorization
        if ($quiz->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Create new quiz
            $newQuiz = Quiz::create([
                'title' => $quiz->title . ' (Copy)',
                'description' => $quiz->description,
                'user_id' => auth()->id(),
            ]);

            // Duplicate questions with order
            foreach ($quiz->questions as $question) {
                $newQuiz->questions()->attach($question->id, [
                    'display_order' => $question->pivot->display_order
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Quiz duplicated successfully!',
                'data' => $newQuiz->load(['user', 'questions'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate quiz: ' . $e->getMessage()
            ], 500);
        }
    }

    public function quizActive(Request $request)
    {
        $quiz = Quiz::find($request->id);

        if ($quiz) {
            DB::transaction(function () use ($quiz) {
                Quiz::where('type', $quiz->type)
                    ->update(['isActive' => 0]);

                $quiz->isActive = 1;
                $quiz->save();
            });

            return response()->json([
                'success' => true,
                'message' => 'Quiz activated successfully'
            ]);
        }
    }

    public function answerQuiz(Request $request)
    {
        if ($request->type === 'rating') {
            $quizzes = Quiz::with(['user', 'questions'])
                ->where('type', "rate")
                ->where('isActive', 1)
                ->orderBy('created_at', 'desc')
                ->first();

            return response()->json($quizzes->questions);
        }

        $quizzes = Quiz::with(['user', 'questions'])
            ->where('type', "abcd")
            ->where('isActive', 1)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$quizzes) {
            return response()->json(['message' => 'No active quiz found'], 404);
        }

        // Get questions with choices_with_urls accessor
        $questions = $quizzes->questions->map(function ($question) {
            return [
                'id' => $question->id,
                'type' => $question->type,
                'question' => $question->question,
                'description' => $question->description,
                'required' => $question->required,
                'choices' => $question->choices_with_urls, // This uses the accessor
                'created_at' => $question->created_at,
                'updated_at' => $question->updated_at,
                'pivot' => $question->pivot // If you need pivot data
            ];
        });

        return response()->json($questions);
    }

    public function saveAlumniQuiz(Request $request)
    {
        try {
            Log::info('Alumni Quiz Submission Received', $request->all());

            // Validate the request
            $validator = Validator::make($request->all(), [
                'quizId' => 'required',
                'timeSpent' => 'required|integer|min:1',
                'type' => 'required|string|max:30',
                'answers' => 'required|array|min:1',
                'answers.*.questionId' => 'required|exists:questions,id',
                // 'answers.*.rating' => 'required|integer|between:1,5',
            ]);

            if ($validator->fails()) {
                Log::error('Validation failed', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get authenticated user
            $user = auth()->user();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            DB::beginTransaction();

            // Create alumni quiz record
            $alumniQuiz = AlumniQuiz::create([
                'user_id' => $user->id,
                'type' => $request->type,
            ]);

            // Save each answer directly to AlumniQuizQuestion
            $answersData = [];
            foreach ($request->answers as $answer) {
                $quizQuestion = AlumniQuizQuestion::create([
                    'alumni_quiz_id' => $alumniQuiz->id,
                    'question_id' => $answer['questionId'],
                    'answer' => (string) $answer['rating'],
                ]);

                $answersData[] = $quizQuestion;
            }

            // Calculate average rating directly from AlumniQuizQuestion
            $averageRating = AlumniQuizQuestion::where('alumni_quiz_id', $alumniQuiz->id)
                ->avg(DB::raw('CAST(answer AS DECIMAL(10,2))'));

            $alumni = \App\Models\Alumni::where('user_id', $user->id)->first();
            $adminUsers = User::where('role', 'admin')->get();

            foreach ($adminUsers as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'notifiable_type' => 'quiz_submission',
                    'data' => json_encode([
                        'title' => 'Quiz Submission',
                        'message' => 'An alumni has submitted the ' . ucfirst($request->type) . ' quiz.',
                        'alumni_quiz_id' => $alumniQuiz->id,
                        'alumni_id' => $alumni ? $alumni->id : null,
                        'alumni_name' => $alumni ? ($alumni->first_name . ' ' . $alumni->last_name) : $user->name,
                        'alumni_profile_image' => $alumni ? $alumni->profile_image_url : null,
                        'quiz_type' => $request->type,
                        'average_rating' => round($averageRating, 2),
                        'time_spent' => $request->timeSpent,
                        'submitted_at' => now()->toIso8601String(),
                    ]),
                    'read' => false,
                ]);
            }

            $quizTypeName = $request->type === 'rating' ? 'Rating Quiz' : 'ABCD Quiz';
            Notification::create([
                'user_id' => $user->id,
                'notifiable_type' => 'quiz_completed',
                'data' => json_encode([
                    'title' => 'Quiz Completed Successfully',
                    'message' => 'Congratulations! You have successfully completed the ' . $quizTypeName . '.',
                    'alumni_quiz_id' => $alumniQuiz->id,
                    'quiz_type' => $request->type,
                    'average_rating' => $request->type === 'rating' ? round($averageRating, 2) : null,
                    'total_questions' => count($answersData),
                    'time_spent' => $request->timeSpent,
                    'completed_at' => now()->toIso8601String(),
                ]),
                'read' => false,
            ]);

            DB::commit();

            Log::info('Alumni Quiz submitted successfully', [
                'alumni_quiz_id' => $alumniQuiz->id,
                'user_id' => $user->id,
                'average_rating' => $averageRating,
                'total_answers' => count($answersData)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Quiz submitted successfully',
                'alumniQuizId' => $alumniQuiz->id,
                'averageRating' => round($averageRating, 2),
                'timeSpent' => $request->timeSpent,
                'totalQuestions' => count($answersData),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving alumni quiz: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save quiz submission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function quizzesResult(Request $request) {
        // $user_id = auth()->user()->id;
        $quizzes = AlumniQuiz::with(['questions','user'])->latest()->get();
        return response()->json($quizzes);
    }
}
