'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '@/lib/api/nutrition';
import { ArrowLeft } from '@untitled-ui/icons-react';
import Link from 'next/link';

export default function NutritionGoalsPage() {
  const queryClient = useQueryClient();
  const { data: goals } = useQuery({
    queryKey: ['nutrition-goals'],
    queryFn: () => nutritionApi.getGoals(),
  });

  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [fiberG, setFiberG] = useState('');

  useEffect(() => {
    if (goals) {
      setCalories(goals.calories?.toString() || '');
      setProteinG(goals.proteinG?.toString() || '');
      setCarbsG(goals.carbsG?.toString() || '');
      setFatG(goals.fatG?.toString() || '');
      setFiberG(goals.fiberG?.toString() || '');
    }
  }, [goals]);

  const mutation = useMutation({
    mutationFn: () => nutritionApi.setGoals({
      calories: calories ? parseInt(calories) : null,
      proteinG: proteinG ? parseFloat(proteinG) : null,
      carbsG: carbsG ? parseFloat(carbsG) : null,
      fatG: fatG ? parseFloat(fatG) : null,
      fiberG: fiberG ? parseFloat(fiberG) : null,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nutrition-goals'] }),
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/nutrition" className="rounded-md p-1 text-muted hover:bg-card-border/50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Nutrition Goals</h1>
      </div>

      <div className="space-y-4 rounded-xl border border-card-border bg-card-bg p-6">
        {[
          { label: 'Daily Calories', value: calories, set: setCalories, unit: 'kcal' },
          { label: 'Protein', value: proteinG, set: setProteinG, unit: 'g' },
          { label: 'Carbohydrates', value: carbsG, set: setCarbsG, unit: 'g' },
          { label: 'Fat', value: fatG, set: setFatG, unit: 'g' },
          { label: 'Fiber', value: fiberG, set: setFiberG, unit: 'g' },
        ].map(({ label, value, set, unit }) => (
          <div key={label}>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
              <span className="text-sm text-muted">{unit}</span>
            </div>
          </div>
        ))}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save Goals'}
        </button>

        {mutation.isSuccess && (
          <p className="text-center text-sm text-success">Goals saved successfully!</p>
        )}
      </div>
    </div>
  );
}
