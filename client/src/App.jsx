import { useCallback, useState } from 'react'
import TopBar from './components/TopBar/index.jsx'
import TabBar from './components/TabBar/index.jsx'
import RecipesView from './components/RecipesView/index.jsx'
import PlanView from './components/PlanView/index.jsx'
import ShoppingListView from './components/ShoppingListView/index.jsx'
import RecipeDetailModal from './components/RecipeDetailModal/index.jsx'
import RecipeFormModal from './components/RecipeFormModal/index.jsx'
import { api } from './api.js'

export default function App() {
  const [activeView, setActiveView] = useState('recipes')
  const [pendingPlan, setPendingPlan] = useState(null) // { dayIndex, mealSlot }
  const [detailRecipe, setDetailRecipe] = useState(null)
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [recipesRefreshToken, setRecipesRefreshToken] = useState(0)
  const [planRefreshToken, setPlanRefreshToken] = useState(0)
  const [shoppingRefreshToken, setShoppingRefreshToken] = useState(0)

  const handleSwitchView = useCallback((view) => {
    setActiveView(view)
    if (view === 'shopping') setShoppingRefreshToken((token) => token + 1)
    if (view !== 'recipes') setPendingPlan(null)
  }, [])

  async function handleAssignSlot(dayIndex, mealSlot, recipeId, serves) {
    await api.setPlanSlot(dayIndex, mealSlot, recipeId, serves)
    setPlanRefreshToken((token) => token + 1)
    setShoppingRefreshToken((token) => token + 1)
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
    setRecipesRefreshToken((token) => token + 1)
  }

  async function handleDeleteRecipe(id) {
    await api.deleteRecipe(id)
    setDetailRecipe(null)
    setRecipesRefreshToken((token) => token + 1)
  }

  return (
    <div className="app-shell">
      <TopBar />
      <TabBar activeView={activeView} onChange={handleSwitchView} shoppingNeedCount={0} />
      <main id="views">
        <RecipesView
          active={activeView === 'recipes'}
          refreshToken={recipesRefreshToken}
          pendingPlan={pendingPlan}
          onCancelPending={() => setPendingPlan(null)}
          onOpenRecipe={setDetailRecipe}
          onQuickAddToPending={handleQuickAddToPending}
          onAddRecipe={() => setShowAddRecipe(true)}
        />
        <PlanView
          active={activeView === 'plan'}
          refreshToken={planRefreshToken}
          onPlanChanged={() => setShoppingRefreshToken((token) => token + 1)}
          onAddSlot={handleRequestSlot}
        />
        <ShoppingListView active={activeView === 'shopping'} refreshToken={shoppingRefreshToken} />
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
