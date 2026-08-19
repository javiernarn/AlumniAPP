<?php

namespace Database\Factories;

use App\Models\Alumni;
use Illuminate\Database\Eloquent\Factories\Factory;

class AlumniFactory extends Factory
{
    protected $model = Alumni::class;

    public function definition()
    {
        return [
            'application_id' => 'APP-' . $this->faker->unique()->numerify('######'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->numerify('09#########'),
            'address' => $this->faker->address(),
            'gender' => $this->faker->randomElement(['male', 'female', 'other', 'prefer_not_to_say']),
            'course' => 'BSIT',
            'graduation_year' => $this->faker->year(),
            'status' => 'approved',
        ];
    }
}
