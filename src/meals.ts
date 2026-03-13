
export type Meal = {
  id: number
  name: string
  calories: number
  price: number
}

export type Order = {
  id: number
  meals: Meal[]
  total: number
}

// (Etape 6)
export type MealDraft = Partial<Meal>
export type MealPreview = Omit<Meal, 'calories'>
export type MealCatalog = Record<number, Meal>



const API_URL = 'https://keligmartin.github.io/api/meals.json'

export async function fetchMeals(): Promise<Meal[]> {
  try {
    const response = await fetch(API_URL)
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`)
    }
    const data: Meal[] = await response.json()
    return data
  } catch (error) {
    console.error('Erreur lors du chargement des repas', error)
    return []
  }
}


let localMeals: Meal[] = []
let nextMealId = 1000

export function addLocalMeal(draft: MealDraft): Meal | null {
  if (
    draft.name === undefined ||
    draft.calories === undefined ||
    draft.price === undefined
  ) {
    console.error("Repas incomplet, impossible de l'ajouter")
    return null
  }
  const meal: Meal = {
    id: nextMealId++,
    name: draft.name,
    calories: draft.calories,
    price: draft.price,
  }
  localMeals.push(meal)
  return meal
}

export function getLocalMeals(): Meal[] {
  return localMeals
}