(() => {
  "use strict";

  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MEAL_SLOTS = ["breakfast", "lunch", "dinner"];
  const DIETARY_TAGS = [
    { key: "vegetarian", label: "Vegetarian" },
    { key: "vegan", label: "Vegan" },
    { key: "gluten-free", label: "Gluten-free" },
    { key: "dairy-free", label: "Dairy-free" },
  ];
  const MEAL_TYPE_OPTIONS = [
    { key: "breakfast", label: "Breakfast" },
    { key: "lunch", label: "Lunch" },
    { key: "dinner", label: "Dinner" },
    { key: "dessert", label: "Dessert" },
  ];

  const state = {
    dietaryPrefs: [],       // persisted preference, also used as recipe filter
    mealTypeFilter: [],     // transient filter, not persisted
    searchQuery: "",
    recipes: [],
    plan: null,             // { week: [...] }
    pendingPlan: null,      // { dayIndex, mealSlot } when user came from "+ Add" in Plan view
    ingredientRowCount: 0,
  };

  // ---------- tiny fetch helpers ----------

  async function api(path, options = {}) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body.error) msg = body.error;
      } catch (_) {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  // ---------- tabs ----------

  function initTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => switchView(btn.dataset.view));
    });
  }

  function switchView(viewName) {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.view === viewName));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${viewName}`));
    if (viewName === "shopping") loadShoppingList();
    if (viewName === "plan") loadPlan();
    if (viewName !== "recipes") hidePlanningBanner();
  }

  // ---------- Recipes view: filter chips ----------

  function renderFilterChips() {
    const dietWrap = document.getElementById("dietary-chips");
    dietWrap.innerHTML = "";
    DIETARY_TAGS.forEach((tag) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (state.dietaryPrefs.includes(tag.key) ? " is-selected" : "");
      chip.textContent = tag.label;
      chip.addEventListener("click", () => toggleDietaryPref(tag.key));
      dietWrap.appendChild(chip);
    });

    const mealWrap = document.getElementById("mealtype-chips");
    mealWrap.innerHTML = "";
    MEAL_TYPE_OPTIONS.forEach((tag) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (state.mealTypeFilter.includes(tag.key) ? " is-selected" : "");
      chip.textContent = tag.label;
      chip.addEventListener("click", () => toggleMealTypeFilter(tag.key));
      mealWrap.appendChild(chip);
    });
  }

  async function toggleDietaryPref(key) {
    const idx = state.dietaryPrefs.indexOf(key);
    if (idx >= 0) state.dietaryPrefs.splice(idx, 1);
    else state.dietaryPrefs.push(key);
    renderFilterChips();
    await api("/api/preferences", { method: "PUT", body: JSON.stringify({ dietary: state.dietaryPrefs }) });
    loadRecipes();
  }

  function toggleMealTypeFilter(key) {
    const idx = state.mealTypeFilter.indexOf(key);
    if (idx >= 0) state.mealTypeFilter.splice(idx, 1);
    else state.mealTypeFilter.push(key);
    renderFilterChips();
    loadRecipes();
  }

  function initSearch() {
    const input = document.getElementById("search-input");
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        state.searchQuery = input.value.trim();
        loadRecipes();
      }, 200);
    });
  }

  // ---------- Recipes view: list ----------

  async function loadRecipes() {
    const params = new URLSearchParams();
    if (state.dietaryPrefs.length) params.set("dietary", state.dietaryPrefs.join(","));
    if (state.mealTypeFilter.length) params.set("mealType", state.mealTypeFilter.join(","));
    if (state.searchQuery) params.set("q", state.searchQuery);

    const recipes = await api(`/api/recipes?${params.toString()}`);
    state.recipes = recipes;
    renderRecipeList();
  }

  function renderRecipeList() {
    const list = document.getElementById("recipe-list");
    const empty = document.getElementById("recipe-empty");
    list.innerHTML = "";

    if (!state.recipes.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    state.recipes.forEach((recipe) => {
      list.appendChild(buildRecipeCard(recipe));
    });
  }

  function buildRecipeCard(recipe) {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${recipe.name} — view recipe`);

    const top = document.createElement("div");
    top.className = "recipe-card-top";

    const left = document.createElement("div");
    const name = document.createElement("h3");
    name.className = "recipe-name";
    name.textContent = recipe.name;
    const meta = document.createElement("div");
    meta.className = "recipe-meta";
    meta.textContent = recipe.cuisine ? `Serves ${recipe.serves}, ${capitalise(recipe.cuisine)}` : `Serves ${recipe.serves}`;
    left.appendChild(name);
    left.appendChild(meta);
    top.appendChild(left);
    card.appendChild(top);

    const tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    recipe.mealType.forEach((m) => tagRow.appendChild(makeTag(capitalise(m), "tag-meal")));
    recipe.dietary.forEach((d) => tagRow.appendChild(makeTag(dietaryLabel(d), "tag-diet")));
    recipe.tags.forEach((t) => tagRow.appendChild(makeTag(capitalise(t.replace(/-/g, " ")), "tag-note")));
    if (recipe.isCustom) tagRow.appendChild(makeTag("Yours", "tag-custom"));
    card.appendChild(tagRow);

    const actions = document.createElement("div");
    actions.className = "recipe-card-actions";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary btn-sm";
    addBtn.textContent = state.pendingPlan ? "Add to this slot" : "View & add to plan";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (state.pendingPlan) {
        assignRecipeToPending(recipe.id);
      } else {
        openDetailModal(recipe);
      }
    });
    actions.appendChild(addBtn);
    card.appendChild(actions);

    card.addEventListener("click", () => openDetailModal(recipe));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetailModal(recipe); }
    });

    return card;
  }

  function makeTag(text, cls) {
    const s = document.createElement("span");
    s.className = `tag ${cls}`;
    s.textContent = text;
    return s;
  }

  function dietaryLabel(key) {
    const found = DIETARY_TAGS.find((d) => d.key === key);
    return found ? found.label : capitalise(key);
  }

  function capitalise(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  // ---------- Planning banner (when arriving from Plan view "+ Add") ----------

  function showPlanningBanner() {
    const banner = document.getElementById("planning-banner");
    const text = document.getElementById("planning-banner-text");
    text.textContent = `${DAY_NAMES[state.pendingPlan.dayIndex]}, ${capitalise(state.pendingPlan.mealSlot)}`;
    banner.hidden = false;
  }

  function hidePlanningBanner() {
    state.pendingPlan = null;
    document.getElementById("planning-banner").hidden = true;
    renderRecipeList();
  }

  async function assignRecipeToPending(recipeId) {
    const { dayIndex, mealSlot } = state.pendingPlan;
    await api(`/api/plan/${dayIndex}/${mealSlot}`, { method: "PUT", body: JSON.stringify({ recipeId }) });
    state.pendingPlan = null;
    document.getElementById("planning-banner").hidden = true;
    switchView("plan");
  }

  // ---------- Detail modal (view recipe + manual plan picker) ----------

  function openDetailModal(recipe) {
    const modal = document.getElementById("detail-modal");
    const content = document.getElementById("detail-content");
    content.innerHTML = "";

    const title = document.createElement("h2");
    title.className = "detail-title";
    title.textContent = recipe.name;
    content.appendChild(title);

    const meta = document.createElement("p");
    meta.className = "detail-meta";
    meta.textContent = recipe.cuisine ? `Serves ${recipe.serves}, ${capitalise(recipe.cuisine)}` : `Serves ${recipe.serves}`;
    content.appendChild(meta);

    const tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    recipe.mealType.forEach((m) => tagRow.appendChild(makeTag(capitalise(m), "tag-meal")));
    recipe.dietary.forEach((d) => tagRow.appendChild(makeTag(dietaryLabel(d), "tag-diet")));
    content.appendChild(tagRow);

    const ingTitle = document.createElement("h3");
    ingTitle.className = "detail-section-title";
    ingTitle.textContent = "Ingredients";
    content.appendChild(ingTitle);
    const ingList = document.createElement("ul");
    ingList.className = "detail-ing-list";
    recipe.ingredients.forEach((ing) => {
      const li = document.createElement("li");
      li.textContent = formatIngredient(ing);
      ingList.appendChild(li);
    });
    content.appendChild(ingList);

    const methodTitle = document.createElement("h3");
    methodTitle.className = "detail-section-title";
    methodTitle.textContent = "Method";
    content.appendChild(methodTitle);
    const methodList = document.createElement("ol");
    methodList.className = "detail-method-list";
    recipe.method.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      methodList.appendChild(li);
    });
    content.appendChild(methodList);

    // Plan picker
    const pickerTitle = document.createElement("h3");
    pickerTitle.className = "detail-section-title";
    pickerTitle.textContent = "Add to this week's plan";
    content.appendChild(pickerTitle);

    const picker = document.createElement("div");
    picker.className = "plan-picker";

    const row = document.createElement("div");
    row.className = "plan-picker-row";

    const daySelect = document.createElement("select");
    DAY_NAMES.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = d;
      daySelect.appendChild(opt);
    });

    const slotSelect = document.createElement("select");
    MEAL_SLOTS.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = capitalise(s);
      slotSelect.appendChild(opt);
    });
    if (recipe.mealType.includes("dinner")) slotSelect.value = "dinner";
    else if (recipe.mealType.includes("lunch")) slotSelect.value = "lunch";
    else if (recipe.mealType.includes("breakfast")) slotSelect.value = "breakfast";

    row.appendChild(daySelect);
    row.appendChild(slotSelect);
    picker.appendChild(row);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary";
    addBtn.textContent = "Add to plan";
    addBtn.addEventListener("click", async () => {
      addBtn.disabled = true;
      addBtn.textContent = "Adding…";
      await api(`/api/plan/${daySelect.value}/${slotSelect.value}`, {
        method: "PUT",
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      modal.close();
      switchView("plan");
    });
    picker.appendChild(addBtn);

    if (recipe.isCustom) {
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-danger-text";
      delBtn.textContent = "Remove this recipe";
      delBtn.addEventListener("click", async () => {
        await api(`/api/recipes/${recipe.id}`, { method: "DELETE" });
        modal.close();
        loadRecipes();
      });
      picker.appendChild(delBtn);
    }

    content.appendChild(picker);

    modal.showModal();
  }

  function formatIngredient(ing) {
    const parts = [];
    if (ing.quantity !== null && ing.quantity !== undefined) parts.push(ing.quantity);
    if (ing.unit) parts.push(ing.unit);
    let line = parts.length ? `${parts.join(" ")} ${ing.item}` : ing.item;
    if (ing.prep) line += `, ${ing.prep}`;
    return line;
  }

  // ---------- Plan view ----------

  async function loadPlan() {
    const data = await api("/api/plan");
    state.plan = data;
    renderPlan();
  }

  function renderPlan() {
    const wrap = document.getElementById("plan-days");
    wrap.innerHTML = "";

    const today = (new Date().getDay() + 6) % 7; // convert Sun=0 -> Mon=0 index

    state.plan.week.forEach((day) => {
      const filledCount = MEAL_SLOTS.filter((s) => day.meals[s]).length;

      const dayEl = document.createElement("div");
      dayEl.className = "plan-day" + (day.dayIndex === today ? " is-open" : "");

      const head = document.createElement("button");
      head.type = "button";
      head.className = "plan-day-head";
      head.innerHTML = `
        <span class="plan-day-bar"></span>
        <span class="plan-day-name">${day.dayName}</span>
        ${day.dayIndex === today ? '<span class="today-pill">Today</span>' : ""}
        <span class="plan-day-summary">${filledCount ? `${filledCount} of 3 planned` : "Nothing planned"}</span>
      `;
      head.addEventListener("click", () => dayEl.classList.toggle("is-open"));
      dayEl.appendChild(head);

      const body = document.createElement("div");
      body.className = "plan-day-body";

      MEAL_SLOTS.forEach((slot) => {
        const row = document.createElement("div");
        row.className = "meal-slot-row";

        const label = document.createElement("span");
        label.className = "meal-slot-label";
        label.textContent = slot;
        row.appendChild(label);

        if (day.meals[slot]) {
          const filled = document.createElement("div");
          filled.className = "meal-slot-filled";
          const rName = document.createElement("span");
          rName.className = "meal-slot-recipe-name";
          rName.textContent = day.meals[slot].name;
          filled.appendChild(rName);

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "btn-danger-text";
          removeBtn.textContent = "Remove";
          removeBtn.addEventListener("click", async () => {
            await api(`/api/plan/${day.dayIndex}/${slot}`, { method: "DELETE" });
            loadPlan();
          });
          filled.appendChild(removeBtn);
          row.appendChild(filled);
        } else {
          const addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className = "link-btn";
          addBtn.textContent = "+ Add a recipe";
          addBtn.addEventListener("click", () => {
            state.pendingPlan = { dayIndex: day.dayIndex, mealSlot: slot };
            switchView("recipes");
            showPlanningBanner();
            renderRecipeList();
          });
          row.appendChild(addBtn);
        }

        body.appendChild(row);
      });

      dayEl.appendChild(body);
      wrap.appendChild(dayEl);
    });
  }

  function initClearPlan() {
    document.getElementById("clear-plan-btn").addEventListener("click", async () => {
      if (!confirm("Clear every meal planned for this week?")) return;
      await api("/api/plan", { method: "DELETE" });
      loadPlan();
      loadShoppingList();
    });
  }

  // ---------- Shopping list view ----------

  async function loadShoppingList() {
    const data = await api("/api/shopping-list");
    renderShoppingList(data);
  }

  function renderShoppingList(data) {
    const wrap = document.getElementById("shopping-list-wrap");
    wrap.innerHTML = "";

    const needCount = data.list.filter((i) => !i.haveIt).length;
    const badge = document.getElementById("shopping-count");
    if (needCount > 0) { badge.hidden = false; badge.textContent = needCount; }
    else badge.hidden = true;

    if (!data.recipeCount) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = "Nothing planned yet. Add meals to the week and your list will build itself here.";
      wrap.appendChild(p);
      return;
    }

    if (!data.list.length) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = "Every ingredient for this week is already ticked off. Nice.";
      wrap.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "shop-list";

    data.list.forEach((item) => {
      const li = document.createElement("li");
      li.className = "shop-item" + (item.haveIt ? " is-have" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.haveIt;
      checkbox.id = "shop-" + slug(item.item);
      checkbox.addEventListener("change", async () => {
        await api(`/api/pantry/${encodeURIComponent(item.item)}`, {
          method: "PUT",
          body: JSON.stringify({ haveIt: checkbox.checked }),
        });
        loadShoppingList();
      });
      li.appendChild(checkbox);

      const main = document.createElement("div");
      main.className = "shop-item-main";

      const label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.className = "shop-item-name";
      label.textContent = capitalise(item.item);
      main.appendChild(label);

      if (item.quantity !== null) {
        const qty = document.createElement("span");
        qty.className = "shop-item-qty";
        qty.textContent = ` — ${item.quantity}${item.unit ? " " + item.unit : ""}`;
        main.appendChild(qty);
      }

      const sources = document.createElement("div");
      sources.className = "shop-item-sources";
      sources.textContent = "For: " + item.fromRecipes.join(", ");
      main.appendChild(sources);

      li.appendChild(main);
      ul.appendChild(li);
    });

    wrap.appendChild(ul);
  }

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // ---------- Add-your-own-recipe modal ----------

  function initRecipeForm() {
    const modal = document.getElementById("recipe-modal");
    const form = document.getElementById("recipe-form");
    const errorEl = document.getElementById("form-error");

    document.getElementById("add-recipe-btn").addEventListener("click", () => {
      form.reset();
      errorEl.hidden = true;
      document.getElementById("f-ingredients").innerHTML = "";
      state.ingredientRowCount = 0;
      addIngredientRow();
      addIngredientRow();
      buildCheckboxGroup("f-mealtype", MEAL_TYPE_OPTIONS);
      buildCheckboxGroup("f-dietary", DIETARY_TAGS);
      modal.showModal();
    });

    document.getElementById("modal-cancel").addEventListener("click", () => modal.close());
    document.getElementById("f-add-ingredient").addEventListener("click", () => addIngredientRow());

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorEl.hidden = true;

      const name = document.getElementById("f-name").value.trim();
      const serves = Number(document.getElementById("f-serves").value) || 2;
      const cuisine = document.getElementById("f-cuisine").value.trim();
      const methodLines = document.getElementById("f-method").value
        .split("\n").map((l) => l.trim()).filter(Boolean);

      const mealType = Array.from(document.querySelectorAll("#f-mealtype .chip.is-selected")).map((c) => c.dataset.key);
      const dietary = Array.from(document.querySelectorAll("#f-dietary .chip.is-selected")).map((c) => c.dataset.key);

      const ingredients = Array.from(document.querySelectorAll(".ingredient-row")).map((row) => {
        const item = row.querySelector(".ing-item").value.trim();
        const qtyRaw = row.querySelector(".ing-qty").value.trim();
        const unit = row.querySelector(".ing-unit").value.trim();
        return {
          item,
          quantity: qtyRaw === "" ? null : Number(qtyRaw),
          unit: unit === "" ? null : unit,
        };
      }).filter((ing) => ing.item);

      if (!name || !ingredients.length || !methodLines.length) {
        errorEl.textContent = "Please add a name, at least one ingredient, and at least one method step.";
        errorEl.hidden = false;
        return;
      }

      try {
        await api("/api/recipes", {
          method: "POST",
          body: JSON.stringify({ name, serves, cuisine, mealType, dietary, ingredients, method: methodLines }),
        });
        modal.close();
        loadRecipes();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
      }
    });
  }

  function buildCheckboxGroup(containerId, options) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = "";
    options.forEach((opt) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.textContent = opt.label;
      chip.dataset.key = opt.key;
      chip.addEventListener("click", () => chip.classList.toggle("is-selected"));
      wrap.appendChild(chip);
    });
  }

  function addIngredientRow() {
    state.ingredientRowCount++;
    const wrap = document.getElementById("f-ingredients");
    const row = document.createElement("div");
    row.className = "ingredient-row";
    row.innerHTML = `
      <input class="ing-item" type="text" placeholder="Ingredient (e.g. onion)">
      <input class="ing-qty" type="number" step="any" placeholder="Qty">
      <input class="ing-unit" type="text" placeholder="Unit (g, tbsp…)">
      <button type="button" class="btn-danger-text" aria-label="Remove ingredient">✕</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    wrap.appendChild(row);
  }

  // ---------- init ----------

  async function init() {
    initTabs();
    initSearch();
    initClearPlan();
    initRecipeForm();

    document.getElementById("planning-cancel").addEventListener("click", hidePlanningBanner);

    try {
      const prefs = await api("/api/preferences");
      state.dietaryPrefs = prefs.dietary;
    } catch (_) {}

    renderFilterChips();
    await loadRecipes();
  }

  init();
})();
