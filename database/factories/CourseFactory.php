<?php

namespace Database\Factories;

use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition()
    {
        return [
            'course_code' => strtoupper($this->faker->unique()->lexify('CRS??')),
            'course_name' => $this->faker->words(4, true),
        ];
    }
}
