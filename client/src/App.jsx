import { useCallback, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import TabBar from './components/TabBar.jsx'
import RecipesView from './components/RecipesView.jsx'
import PlanView from './components/PlanView.jsx'
import ShoppingListView from './components/ShoppingListView.jsx'
import RecipeDetailModal from './components/RecipeDetailModal.jsx'
import RecipeFormModal from './components/RecipeFormModal.jsx'
import { usePreferences } from './hooks/usePreferences.js'
import { useRecipes } from './hooks/useRecipes.js'
import { usePlan } from './hooks/usePlan.js'
import { useShoppingList } from './hooks/useShoppingList.js'
import { api } from './api.js'

export default function App() {
  const [activeView, setActiveView] = useState('recipes')
  const [mealTypeFilter, setMealTypeFilter] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingPlan, setPendingPlan] = useState(null) // { dayIndex, mealSlot }
  const [detailRecipe, setDetailRecipe] = useState(null)
  const [showAddRecipe, setShowAddRecipe] = useState(false)

  const { dietary: dietaryPrefs, toggle: toggleDietaryPref, loaded: prefsLoaded } = usePreferences()
  const { recipes, refreshRecipes } = useRecipes({ dietary: dietaryPrefs, mealType: mealTypeFilter, query: searchQuery })
  const { plan, refreshPlan } = usePlan()
  const { list: shoppingList, refreshShoppingList } = useShoppingList()

  const shoppingNeedCount = shoppingList ? shoppingList.list.filter((i) => !i.haveIt).length : 0

  const toggleMealType = useCallback((key) => {
    setMealTypeFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }, [])

  function handleSwitchView(view) {
    setActiveView(view)
    if (view !== 'recipes') setPendingPlan(null)
  }

  async function handleAssignSlot(dayIndex, mealSlot, recipeId, serves) {
    await api.setPlanSlot(dayIndex, mealSlot, recipeId, serves)
    refreshPlan()
    refreshShoppingList()
  }

  async function handleQuickAddToPending(recipe) {
    if (!pendingPlan) return
    await handleAssignSlot(pendingPlan.dayIndex, pendingPlan.mealSlot, recipe.id, recipe.serves)
    setPendingPlan(null)
    setActiveView('plan')
  }

  async function handleAddToPlanFromDetail(dayIndex, mealSlot, recipeId, serves) {
    await handleAssignSlot(dayIndex, mealSlot, recipeId, serves)
    setDetailRecipe(null)
    setActiveView('plan')
  }

  function handleRequestSlot(dayIndex, mealSlot) {
    setPendingPlan({ dayIndex, mealSlot })
    setActiveView('recipes')
  }

  async function handleRemoveSlot(dayIndex, mealSlot) {
    await api.clearPlanSlot(dayIndex, mealSlot)
    refreshPlan()
    refreshShoppingList()
  }

  async function handleUpdateServes(dayIndex, mealSlot, recipeId, serves) {
    if (!Number.isInteger(serves) || serves < 1) return
    await handleAssignSlot(dayIndex, mealSlot, recipeId, serves)
  }

  async function handleClearPlan() {
    if (!confirm('Clear every meal planned for this week?')) return
    await api.clearPlan()
    refreshPlan()
    refreshShoppingList()
  }

  async function handleTogglePantry(itemName, haveIt) {
    await api.setPantryItem(itemName, haveIt)
    refreshShoppingList()
  }

  async function handleSaveRecipe(recipe) {
    await api.addRecipe(recipe)
    setShowAddRecipe(false)
    refreshRecipes()
  }

  async function handleDeleteRecipe(id) {
    await api.deleteRecipe(id)
    setDetailRecipe(null)
    refreshRecipes()
  }

  return (
    <div className="app-shell">
      <TopBar />
      <TabBar activeView={activeView} onChange={handleSwitchView} shoppingNeedCount={shoppingNeedCount} />

      <main id="views">
        {activeView === 'recipes' && prefsLoaded && (
          <RecipesView
            recipes={recipes}
            dietaryPrefs={dietaryPrefs}
            onToggleDietary={toggleDietaryPref}
            mealTypeFilter={mealTypeFilter}
            onToggleMealType={toggleMealType}
            onSearch={setSearchQuery}
            pendingPlan={pendingPlan}
            onCancelPending={() => setPendingPlan(null)}
            onOpenRecipe={setDetailRecipe}
            onQuickAddToPending={handleQuickAddToPending}
            onAddRecipe={() => setShowAddRecipe(true)}
          />
        )}

        {activeView === 'plan' && (
          <PlanView
            plan={plan}
            onAddSlot={handleRequestSlot}
            onRemoveSlot={handleRemoveSlot}
            onUpdateServes={handleUpdateServes}
            onClearPlan={handleClearPlan}
          />
        )}

        {activeView === 'shopping' && <ShoppingListView list={shoppingList} onTogglePantry={handleTogglePantry} />}
      </main>

      <RecipeDetailModal
        recipe={detailRecipe}
        onClose={() => setDetailRecipe(null)}
        onAddToPlan={handleAddToPlanFromDetail}
        onDeleteRecipe={handleDeleteRecipe}
      />

      <RecipeFormModal open={showAddRecipe} onClose={() => setShowAddRecipe(false)} onSave={handleSaveRecipe} />
    </div>
  )
}
