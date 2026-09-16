import { useCallback, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import TabBar from './components/TabBar.jsx'
import RecipesView from './components/RecipesView.jsx'
import PlanView from './components/PlanView.jsx'
import ShoppingListView from './components/ShoppingListView.jsx'
import RecipeDetailModal from './components/RecipeDetailModal.jsx'
import RecipeFormModal from './components/RecipeFormModal.jsx'
import { api } from './api.js'

export default function App() {
  const [activeView, setActiveView] = useState('recipes')
  const [pendingPlan, setPendingPlan] = useState(null) // { dayIndex, mealSlot }
  const [detailRecipe, setDetailRecipe] = useState(null)
  const [showAddRecipe, setShowAddRecipe] = useState(false)

  const handleSwitchView = useCallback((view) => {
    setActiveView(view)
    if (view !== 'recipes') setPendingPlan(null)
  }, [])

  async function handleAssignSlot(dayIndex, mealSlot, recipeId, serves) {
    await api.setPlanSlot(dayIndex, mealSlot, recipeId, serves)
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

  async function handleSaveRecipe(recipe) {
    await api.addRecipe(recipe)
    setShowAddRecipe(false)
  }

  async function handleDeleteRecipe(id) {
    await api.deleteRecipe(id)
    setDetailRecipe(null)
  }

  return (
    <div className="app-shell">
      <TopBar />
      <TabBar activeView={activeView} onChange={handleSwitchView} shoppingNeedCount={0} />

      <main id="views">
        {activeView === 'recipes' && (
          <RecipesView
            pendingPlan={pendingPlan}
            onCancelPending={() => setPendingPlan(null)}
            onOpenRecipe={setDetailRecipe}
            onQuickAddToPending={handleQuickAddToPending}
            onAddRecipe={() => setShowAddRecipe(true)}
          />
        )}

        {activeView === 'plan' && <PlanView onAddSlot={handleRequestSlot} />}

        {activeView === 'shopping' && <ShoppingListView />}
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
