'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/auth';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Check,
  Trash01,
  Upload01,
  Image01,
  X,
} from '@untitled-ui/icons-react';
import { nutritionApi } from '@/lib/api/nutrition';
import { useAuthStore } from '@/lib/stores/auth';
import { format } from 'date-fns';
import type { MealType, FoodAnalysisResult } from '@/types/nutrition';


const FDA_DV = {
  fat: 78,
  saturatedFat: 20,
  cholesterol: 300,
  sodium: 2300,
  carbs: 275,
  fiber: 28,
  protein: 50,
  potassium: 4700,
} as const;

function dvPercent(value: number, dv: number): number {
  return Math.round((value / dv) * 100);
}


interface EditableFood {
  name: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  transFatG: number;
  cholesterolMg: number;
  sodiumMg: number;
  fiberG: number;
  sugarG: number;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'SNACK', label: 'Snack' },
];

const EMPTY_FOOD: EditableFood = {
  name: '',
  servingSize: '',
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  saturatedFatG: 0,
  transFatG: 0,
  cholesterolMg: 0,
  sodiumMg: 0,
  fiberG: 0,
  sugarG: 0,
};


function MiniNutritionLabel({
  food,
  index,
  onUpdate,
  onRemove,
}: {
  food: EditableFood;
  index: number;
  onUpdate: (index: number, field: keyof EditableFood, value: string | number) => void;
  onRemove: (index: number) => void;
}) {
  function numInput(
    field: keyof EditableFood,
    value: number,
    className?: string
  ) {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onUpdate(index, field, Number(e.target.value))}
        className={`w-16 bg-transparent text-right font-mono tabular-nums text-sm focus:outline-none border-b border-transparent focus:border-blue-500 ${
          className ?? ''
        }`}
      />
    );
  }

  const rows: {
    label: string;
    field: keyof EditableFood;
    unit: string;
    dv?: number;
    bold?: boolean;
    indent?: boolean;
    thick?: boolean;
  }[] = [
    {
      label: 'Total Fat',
      field: 'fatG',
      unit: 'g',
      dv: FDA_DV.fat,
      bold: true,
    },
    {
      label: 'Saturated Fat',
      field: 'saturatedFatG',
      unit: 'g',
      dv: FDA_DV.saturatedFat,
      indent: true,
    },
    {
      label: 'Trans Fat',
      field: 'transFatG',
      unit: 'g',
      indent: true,
    },
    {
      label: 'Cholesterol',
      field: 'cholesterolMg',
      unit: 'mg',
      dv: FDA_DV.cholesterol,
      bold: true,
    },
    {
      label: 'Sodium',
      field: 'sodiumMg',
      unit: 'mg',
      dv: FDA_DV.sodium,
      bold: true,
    },
    {
      label: 'Total Carbs',
      field: 'carbsG',
      unit: 'g',
      dv: FDA_DV.carbs,
      bold: true,
      thick: true,
    },
    {
      label: 'Dietary Fiber',
      field: 'fiberG',
      unit: 'g',
      dv: FDA_DV.fiber,
      indent: true,
    },
    {
      label: 'Total Sugars',
      field: 'sugarG',
      unit: 'g',
      indent: true,
    },
    {
      label: 'Protein',
      field: 'proteinG',
      unit: 'g',
      dv: FDA_DV.protein,
      bold: true,
      thick: true,
    },
  ];

  return (
    <div className="border-2 border-black bg-white text-black p-2 rounded-sm">
      <div className="flex items-start justify-between gap-2">
        <input
          value={food.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
          className="text-lg font-extrabold bg-transparent focus:outline-none border-b border-transparent focus:border-blue-500 flex-1 min-w-0"
          placeholder="Food name"
        />
        <button
          onClick={() => onRemove(index)}
          className="shrink-0 text-gray-400 hover:text-red-500 transition-colors mt-1"
          title="Remove item"
        >
          <Trash01 className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-black mt-0.5" />

      <div className="flex items-center gap-1 py-0.5 text-sm">
        <span className="text-gray-600">Serving size</span>
        <input
          value={food.servingSize}
          onChange={(e) => onUpdate(index, 'servingSize', e.target.value)}
          className="bg-transparent font-medium focus:outline-none border-b border-transparent focus:border-blue-500 flex-1 min-w-0"
          placeholder="e.g. 1 cup"
        />
      </div>

      <div className="border-b-8 border-black" />

      <div className="flex justify-between items-baseline py-1">
        <span className="text-sm font-bold">Calories</span>
        <div className="flex items-baseline">
          {numInput('calories', food.calories, 'text-2xl font-extrabold w-20')}
        </div>
      </div>

      <div className="border-b-4 border-black" />

      <div className="text-right text-xs font-bold py-0.5">% Daily Value*</div>
      <div className="border-b border-black" />

      {rows.map((row) => {
        const val = food[row.field] as number;
        const dvPct = row.dv ? dvPercent(val, row.dv) : undefined;
        return (
          <div
            key={row.field}
            className={`flex items-center justify-between py-0.5 text-sm ${
              row.thick ? 'border-t-8 border-black' : 'border-t border-gray-300'
            }`}
          >
            <span className={`flex items-center gap-0.5 ${row.indent ? 'pl-4' : ''}`}>
              {row.bold ? (
                <span className="font-bold">{row.label}</span>
              ) : (
                <span>{row.label}</span>
              )}
              <span className="flex items-center">
                {numInput(row.field, val)}
                <span className="text-xs ml-0.5">{row.unit}</span>
              </span>
            </span>
            {dvPct !== undefined ? (
              <span className="font-bold tabular-nums">{dvPct}%</span>
            ) : (
              <span />
            )}
          </div>
        );
      })}

      <div className="border-t-4 border-black mt-1 pt-1">
        <p className="text-[10px] text-gray-500 leading-tight">
          * Percent Daily Values are based on a 2,000 calorie diet.
        </p>
      </div>
    </div>
  );
}


function TotalsLabel({ foods }: { foods: EditableFood[] }) {
  const sums = useMemo(() => {
    const init = { ...EMPTY_FOOD };
    return foods.reduce(
      (acc, f) => ({
        ...acc,
        calories: acc.calories + f.calories,
        fatG: acc.fatG + f.fatG,
        saturatedFatG: acc.saturatedFatG + f.saturatedFatG,
        transFatG: acc.transFatG + f.transFatG,
        cholesterolMg: acc.cholesterolMg + f.cholesterolMg,
        sodiumMg: acc.sodiumMg + f.sodiumMg,
        carbsG: acc.carbsG + f.carbsG,
        fiberG: acc.fiberG + f.fiberG,
        sugarG: acc.sugarG + f.sugarG,
        proteinG: acc.proteinG + f.proteinG,
      }),
      init
    );
  }, [foods]);

  const rows: { label: string; value: string; dv?: number; bold?: boolean; indent?: boolean; thick?: boolean }[] = [
    { label: 'Total Fat', value: `${Math.round(sums.fatG)}g`, dv: dvPercent(sums.fatG, FDA_DV.fat), bold: true },
    { label: 'Saturated Fat', value: `${Math.round(sums.saturatedFatG)}g`, dv: dvPercent(sums.saturatedFatG, FDA_DV.saturatedFat), indent: true },
    { label: 'Trans Fat', value: `${Math.round(sums.transFatG)}g`, indent: true },
    { label: 'Cholesterol', value: `${Math.round(sums.cholesterolMg)}mg`, dv: dvPercent(sums.cholesterolMg, FDA_DV.cholesterol), bold: true },
    { label: 'Sodium', value: `${Math.round(sums.sodiumMg)}mg`, dv: dvPercent(sums.sodiumMg, FDA_DV.sodium), bold: true },
    { label: 'Total Carbs', value: `${Math.round(sums.carbsG)}g`, dv: dvPercent(sums.carbsG, FDA_DV.carbs), bold: true, thick: true },
    { label: 'Dietary Fiber', value: `${Math.round(sums.fiberG)}g`, dv: dvPercent(sums.fiberG, FDA_DV.fiber), indent: true },
    { label: 'Total Sugars', value: `${Math.round(sums.sugarG)}g`, indent: true },
    { label: 'Protein', value: `${Math.round(sums.proteinG)}g`, dv: dvPercent(sums.proteinG, FDA_DV.protein), bold: true, thick: true },
  ];

  return (
    <div className="border-2 border-black bg-white text-black p-2 max-w-sm w-full">
      <h2 className="text-xl font-extrabold tracking-tight">Meal Totals</h2>
      <div className="border-b-8 border-black mt-0.5" />

      <div className="flex justify-between items-baseline py-1">
        <span className="text-sm font-bold">Calories</span>
        <span className="text-2xl font-extrabold tabular-nums">{Math.round(sums.calories)}</span>
      </div>

      <div className="border-b-4 border-black" />
      <div className="text-right text-xs font-bold py-0.5">% Daily Value*</div>
      <div className="border-b border-black" />

      {rows.map((row) => (
        <div
          key={row.label}
          className={`flex justify-between py-0.5 text-sm ${
            row.thick ? 'border-t-8 border-black' : 'border-t border-gray-300'
          }`}
        >
          <span className={row.indent ? 'pl-4' : ''}>
            {row.bold ? <span className="font-bold">{row.label}</span> : row.label}{' '}
            <span className="tabular-nums">{row.value}</span>
          </span>
          {row.dv !== undefined ? (
            <span className="font-bold tabular-nums">{row.dv}%</span>
          ) : (
            <span />
          )}
        </div>
      ))}

      <div className="border-t-4 border-black mt-1 pt-1">
        <p className="text-[10px] text-gray-500 leading-tight">
          * Percent Daily Values are based on a 2,000 calorie diet.
        </p>
      </div>
    </div>
  );
}


export default function NutritionEntryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const defaultMealType = (): MealType => {
    const h = new Date().getHours();
    if (h < 11) return 'BREAKFAST';
    if (h < 15) return 'LUNCH';
    if (h < 21) return 'DINNER';
    return 'SNACK';
  };

  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [mealDate, setMealDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eatenAt, setEatenAt] = useState(format(new Date(), 'HH:mm'));
  const [description, setDescription] = useState('');
  const [analyzedFoods, setAnalyzedFoods] = useState<EditableFood[]>([]);
  const [analysisNotes, setAnalysisNotes] = useState('');
  const [confidence, setConfidence] = useState('');
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [dismissedTip, setDismissedTip] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('nutrition_tip_dismissed') === 'true';
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);


  const populateAnalysisResult = useCallback((data: FoodAnalysisResult) => {
    setAnalyzedFoods(
      data.foods.map((f) => ({
        name: f.name,
        servingSize: f.servingSize,
        calories: f.calories,
        proteinG: f.proteinG,
        carbsG: f.carbsG,
        fatG: f.fatG,
        saturatedFatG: f.saturatedFatG ?? 0,
        transFatG: f.transFatG ?? 0,
        cholesterolMg: f.cholesterolMg ?? 0,
        sodiumMg: f.sodiumMg ?? 0,
        fiberG: f.fiberG ?? 0,
        sugarG: f.sugarG ?? 0,
      }))
    );
    setAnalysisNotes(data.notes);
    setConfidence(data.confidence);
    setHasAnalyzed(true);
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: (desc: string) => nutritionApi.analyze(desc),
    onSuccess: populateAnalysisResult,
  });

  const analyzeImageMutation = useMutation({
    mutationFn: (file: File) => nutritionApi.analyzeImage(file),
    onSuccess: populateAnalysisResult,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const meal = await nutritionApi.addMeal(mealDate, { mealType, eatenAt: eatenAt + ':00' });
      for (const food of analyzedFoods) {
        await nutritionApi.addFood(meal.id, {
          description: food.name,
          servingSize: food.servingSize,
          calories: food.calories || 0,
          proteinG: food.proteinG || 0,
          carbsG: food.carbsG || 0,
          fatG: food.fatG || 0,
          fiberG: food.fiberG || 0,
          sugarG: food.sugarG || 0,
          sodiumMg: food.sodiumMg || 0,
          cholesterolMg: food.cholesterolMg || 0,
          saturatedFatG: food.saturatedFatG || 0,
          transFatG: food.transFatG || 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-day'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-week'] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-month'] });
      router.push('/nutrition');
    },
  });


  const handleAnalyze = () => {
    if (!description.trim()) return;
    analyzeMutation.mutate(description.trim());
  };

  const handleAnalyzeImage = () => {
    if (!imageFile) return;
    analyzeImageMutation.mutate(imageFile);
  };

  const canAnalyzeImage = imageFile && user?.googleConnected;

  const updateFood = (index: number, field: keyof EditableFood, value: string | number) => {
    setAnalyzedFoods((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [field]: value } : f))
    );
  };

  const removeFood = (index: number) => {
    setAnalyzedFoods((prev) => prev.filter((_, i) => i !== index));
  };


  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: () => profileApi.get() });
  const hasApiKey = profileData?.hasOpenaiKey ?? user?.hasOpenaiKey ?? false;

  if (!hasApiKey) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <Zap className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-xl font-bold text-foreground">OpenAI API Key Required</h2>
        <p className="text-sm text-muted">
          The nutrition tracker uses AI to analyze your meals from text descriptions or food photos.
          Set up your OpenAI API key to get started.
        </p>
        <a href="/profile/integrations" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
          Go to Integrations
        </a>
        <a href="/nutrition" className="block text-xs text-muted hover:text-foreground">Back to Nutrition</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <Link
        href="/nutrition"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Nutrition
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Log</h1>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Meal Type</label>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((mt) => (
            <label
              key={mt.value}
              className={`inline-flex items-center gap-2 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mealType === mt.value
                  ? 'bg-primary text-white'
                  : 'border border-card-border bg-card-bg text-foreground hover:bg-sidebar-bg'
              }`}
            >
              <input
                type="radio"
                name="mealType"
                value={mt.value}
                checked={mealType === mt.value}
                onChange={() => setMealType(mt.value)}
                className="sr-only"
              />
              <span
                className={`inline-block w-3.5 h-3.5 rounded-full border-2 ${
                  mealType === mt.value
                    ? 'border-white bg-white/30'
                    : 'border-card-border'
                }`}
              >
                {mealType === mt.value && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-white mx-auto mt-[3px]" />
                )}
              </span>
              {mt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
          <input
            type="date"
            value={mealDate}
            onChange={(e) => setMealDate(e.target.value)}
            className="rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Time Eaten</label>
          <input
            type="time"
            value={eatenAt}
            onChange={(e) => setEatenAt(e.target.value)}
            className="rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {!dismissedTip && (
        <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-4">
          <button onClick={() => { setDismissedTip(true); localStorage.setItem('nutrition_tip_dismissed', 'true'); }} className="absolute top-2 right-2 p-1 text-muted hover:text-foreground rounded-md hover:bg-primary/10 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm font-semibold text-foreground mb-1 pr-6">Log your meal</p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="text-xs text-muted">
              <span className="font-semibold text-foreground">Describe it</span> — List everything you ate (e.g., &quot;8oz steak, asparagus, mashed potatoes with gravy&quot;). AI will identify each item separately.
            </div>
            <div className="text-xs text-muted">
              <span className="font-semibold text-foreground">Or snap a photo</span> — Take a picture of your plate. AI identifies each item, estimates portions using visual cues, and calculates nutrition per item.
            </div>
          </div>
          <p className="text-[10px] text-muted-light mt-2">Each item gets its own nutritional breakdown. You can edit values before saving.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Describe what you ate
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g.: 8oz chicken breast with broccoli and rice, a side salad with ranch dressing"
          rows={4}
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Or upload a food photo
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageSelect(file);
          }}
        />
        {!imagePreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-card-border bg-card-bg hover:border-primary/50'
            }`}
          >
            <Upload01 className="h-8 w-8 text-muted mb-2" />
            <p className="text-sm text-muted">
              Drag & drop a food photo, or <span className="text-primary font-medium">click to browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-light">JPG, PNG up to 10MB</p>
          </div>
        ) : (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Food preview"
              className="h-48 w-auto rounded-lg border border-card-border object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -right-2 -top-2 rounded-full bg-card-bg border border-card-border p-1 text-muted hover:text-danger transition-colors shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAnalyze}
          disabled={!description.trim() || analyzeMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {analyzeMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Analyze Text with AI
            </>
          )}
        </button>

        {canAnalyzeImage && (
          <button
            onClick={handleAnalyzeImage}
            disabled={analyzeImageMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {analyzeImageMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing Image...
              </>
            ) : (
              <>
                <Image01 className="h-4 w-4" />
                Analyze Image with AI
              </>
            )}
          </button>
        )}
      </div>

      {analyzeMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Failed to analyze food description. Please try again.
        </div>
      )}
      {analyzeImageMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Failed to analyze food image. Please try again.
        </div>
      )}

      {hasAnalyzed && analyzedFoods.length > 0 && (
        <div className="space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyzedFoods.map((food, i) => (
              <MiniNutritionLabel
                key={i}
                food={food}
                index={i}
                onUpdate={updateFood}
                onRemove={removeFood}
              />
            ))}
          </div>

          {analyzedFoods.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wide">Meal Totals</h3>
              <div className="flex justify-center">
                <TotalsLabel foods={analyzedFoods} />
              </div>
            </div>
          )}

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || analyzedFoods.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-success px-6 py-2.5 text-sm font-semibold text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
          >
            {saveMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save
              </>
            )}
          </button>

          {saveMutation.isError && (
            <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              Failed to save meal. Please try again.
            </div>
          )}
        </div>
      )}

      {hasAnalyzed && analyzedFoods.length === 0 && (
        <div className="rounded-lg border border-card-border bg-card-bg p-6 text-center">
          <p className="text-sm text-muted">
            No food items were identified. Try describing your meal differently.
          </p>
        </div>
      )}
    </div>
  );
}
