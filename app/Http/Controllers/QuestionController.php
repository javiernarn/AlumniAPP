<?php
// app/Http/Controllers/QuestionController.php

namespace App\Http\Controllers;

use App\Models\Question;
use App\Http\Requests\StoreQuestionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        $query = Question::with('user')->where('user_id', auth()->id());

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $questions = $query->orderBy('created_at', 'desc')->get();

        return response()->json($questions);
    }

    public function store(StoreQuestionRequest $request)
    {
        try {
            $choices = null;

            if ($request->type === 'abcd') {
                $choices = $this->processChoices($request->choices);
            }

            $question = Question::create([
                'type' => $request->type,
                'question' => $request->question,
                'description' => $request->description,
                'required' => $request->required == "true" ? 1 : 0,
                'choices' => $choices,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question created successfully!',
                'data' => $question->load('user')
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create question: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Question $question)
    {
        // Authorization - user can only view their own questions
        if ($question->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $question->load('user')
        ]);
    }

    public function update(StoreQuestionRequest $request, Question $question)
    {
        // Authorization
        if ($question->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            $choices = $question->choices;

            if ($request->type === 'abcd') {
                $choices = $this->processChoices($request->choices, $question->choices);
            } else {
                // Clean up old choice images if type changed from abcd to rate
                $this->cleanupChoiceImages($question->choices);
                $choices = null;
            }

            $question->update([
                'type' => $request->type,
                'question' => $request->question,
                'description' => $request->description,
                'required' => $request->required ?? true,
                'choices' => $choices,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Question updated successfully!',
                'data' => $question->load('user')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update question: ' . $e->getMessage()
            ], 500);
        }
    }





    
    public function destroy(Question $question)
    {
        // Authorization
        if ($question->user_id !== auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        try {
            // Clean up choice images before deleting
            $this->cleanupChoiceImages($question->choices);

            $question->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete question: ' . $e->getMessage()
            ], 500);
        }
    }

    private function processChoices($newChoices, $existingChoices = null)
    {
        logger()->info('Processing choices with new structure:', ['choices' => $newChoices]);

        $processedChoices = [];
        $existingImages = $existingChoices ? collect($existingChoices)->pluck('image')->filter() : collect();

        foreach ($newChoices as $index => $choice) {
            logger()->info("Choice $index:", [
                'interpretation' => $choice['interpretation'] ?? 'NOT_SET',
                'interpretation_type' => isset($choice['interpretation']) ? gettype($choice['interpretation']) : 'NOT_SET',
                'has_image' => isset($choice['image']),
                'image_type' => isset($choice['image']) ? gettype($choice['image']) : 'NOT_SET',
            ]);

            $letter = chr(65 + $index);
            $interpretation = $choice['interpretation'] ?? '';
            $imagePath = $existingImages->get($index);

            if (isset($choice['image']) && $choice['image'] instanceof \Illuminate\Http\UploadedFile) {
                $filename = 'choice_' . time() . '_' . uniqid() . '.' . $choice['image']->getClientOriginalExtension();
                $imagePath = $choice['image']->storeAs('questions/choices', $filename, 'public');
                logger()->info("Uploaded new image: " . $imagePath);
            }

            $processedChoices[] = [
                'letter' => $letter,
                'interpretation' => $interpretation,
                'image' => $imagePath,
            ];
        }

        $this->cleanupUnusedImages($existingImages, collect($processedChoices)->pluck('image'));

        return $processedChoices;
    }

    private function processChoices22($newChoices, $existingChoices = null)
    {
        $processedChoices = [];
        $existingImages = $existingChoices ? collect($existingChoices)->pluck('image')->filter() : collect();

        foreach ($newChoices as $index => $choice) {
            $letter = chr(65 + $index); // A, B, C, D
            $imagePath = null;
            // Handle image upload
            if (isset($choice['image']) && $choice['image'] instanceof \Illuminate\Http\UploadedFile) {
                $filename = 'choice_' . time() . '_' . uniqid() . '.' . $choice['image']->getClientOriginalExtension();
                $imagePath = $choice['image']->storeAs('questions/choices', $filename, 'public');
            } elseif (isset($choice['image']) && is_string($choice['image'])) {
                // Keep existing image if no new image uploaded
                $existingImage = $existingImages->get($index);
                $imagePath = $existingImage ?? $choice['image'];
            }

            $processedChoices[] = [
                'letter' => $letter,
                'interpretation' => $choice['interpretation'] ?? null, // ✅ Fixed: Added null coalescing
                'image' => $imagePath,
            ];
        }

        // Clean up unused images from existing choices
        $this->cleanupUnusedImages($existingImages, collect($processedChoices)->pluck('image'));

        return $processedChoices;
    }

    private function cleanupChoiceImages($choices)
    {
        if (!$choices) return;

        foreach ($choices as $choice) {
            if (isset($choice['image']) && Storage::disk('public')->exists($choice['image'])) {
                Storage::disk('public')->delete($choice['image']);
            }
        }
    }

    private function cleanupUnusedImages($existingImages, $newImages)
    {
        $imagesToDelete = $existingImages->diff($newImages);

        foreach ($imagesToDelete as $imagePath) {
            if (Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
        }
    }
}
