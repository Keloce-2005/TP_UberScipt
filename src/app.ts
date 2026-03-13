import { Meal, fetchMeals, addLocalMeal, getLocalMeals, MealDraft } from './meals.js'
import { User, TropPauvreErreur } from './user.js'


const currentUser = new User(1, 'Bob', 30)
let allMeals: Meal[] = []
let menuSelection: Meal[] = []


function $(id: string): HTMLElement {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Element #${id} introuvable`)
  return el
}

function $input(id: string): HTMLInputElement {
  return $(id) as HTMLInputElement
}

function renderMeals(meals: Meal[]): void {
  const list = $('mealList')
  list.innerHTML = ''

  if (meals.length === 0) {
    list.innerHTML = '<li class="list-group-item text-muted">Aucun repas disponible</li>'
    return
  }

  for (const meal of meals) {
    const li = document.createElement('li')
    li.className = 'list-group-item d-flex justify-content-between align-items-center'
    li.innerHTML = `
      <span>
        <strong>${meal.name}</strong>
        <small class="text-muted ms-2">${meal.calories} kcal</small>
      </span>
      <div class="d-flex gap-1 align-items-center">
        <span class="badge bg-secondary">${meal.price}€</span>
        <button class="btn btn-sm btn-outline-success order-btn" data-id="${meal.id}">
          Commander
        </button>
        <button class="btn btn-sm btn-outline-primary menu-btn" data-id="${meal.id}">
          + Menu
        </button>
      </div>
    `
    list.appendChild(li)
  }

  list.querySelectorAll<HTMLButtonElement>('.order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const meal = allMeals.find(m => m.id === Number(btn.dataset.id))
      if (meal) handleOrder([meal])
    })
  })

  list.querySelectorAll<HTMLButtonElement>('.menu-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const meal = allMeals.find(m => m.id === Number(btn.dataset.id))
      if (meal) addToMenu(meal)
    })
  })
}

function handleOrder(meals: Meal[]): void {
  try {
    const order = currentUser.orderMeals(meals)
    const names = order.meals.map(m => m.name).join(', ')
    alert(`Commande #${order.id} passee !\n${names}\nTotal : ${order.total}€`)
    renderWallet()
    renderHistory()
  } catch (e) {
    if (e instanceof TropPauvreErreur) {
      alert(
        `${e.message}\n\n` +
        `Solde actuel : ${e.solde.toFixed(2)}€\n` +
        `Prix total : ${e.prixCommande.toFixed(2)}€\n` +
        `Manque : ${(e.prixCommande - e.solde).toFixed(2)}€`
      )
    } else {
      alert('Une erreur est survenue.')
    }
  }
}

function renderWallet(): void {
  const container = getOrCreateSection('walletSection', 'Portefeuille')

  let html = `<p class="mb-1"><strong>Utilisateur :</strong> ${currentUser.name}</p>`
  for (const wallet of currentUser.wallets) {
    html += `<p class="mb-1">${wallet.label} : <strong>${wallet.balance.toFixed(2)}€</strong></p>`
  }
  html += `<p class="text-muted">Total depense : ${currentUser.totalSpent().toFixed(2)}€</p>`

  container.innerHTML = html
}

function renderHistory(): void {
  const container = getOrCreateSection('historySection', 'Historique des commandes')

  if (currentUser.orders.length === 0) {
    container.innerHTML = '<p class="text-muted">Aucune commande.</p>'
    return
  }

  let html = ''
  for (const order of [...currentUser.orders].reverse()) {
    const mealNames = order.meals.map(m => m.name).join(', ')
    html += `
      <div class="d-flex justify-content-between align-items-center border-bottom py-1">
        <div>
          <strong>#${order.id}</strong> — ${mealNames}
          <span class="badge bg-info ms-2">${order.total}€</span>
        </div>
        <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${order.id}">
          Annuler
        </button>
      </div>
    `
  }

  container.innerHTML = html

  container.querySelectorAll<HTMLButtonElement>('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = Number(btn.dataset.id)
      if (confirm(`Annuler la commande #${orderId} ?`)) {
        currentUser.cancelOrder(orderId)
        renderWallet()
        renderHistory()
      }
    })
  })
}

// Menu (bonus)
function filterMeals(): void {
  const input = $input('filterPrice').value
  const max = parseFloat(input)

  if (isNaN(max) || input === '') {
    renderMeals(allMeals)
  } else {
    const filtered = allMeals.filter(m => m.price <= max)
    renderMeals(filtered)
  }
}

function addToMenu(meal: Meal): void {
  menuSelection.push(meal)
  renderMenuList()
}

function renderMenuList(): void {
  const list = $('menuList')
  list.innerHTML = ''

  for (const meal of menuSelection) {
    const li = document.createElement('li')
    li.className = 'list-group-item d-flex justify-content-between align-items-center'
    li.innerHTML = `
      <span>${meal.name}</span>
      <span class="badge bg-secondary">${meal.price}€</span>
    `
    list.appendChild(li)
  }
}

function calculateMenu(): void {
  const totalHT = menuSelection.reduce((sum, m) => sum + m.price, 0)
  const totalTTC = totalHT * 1.1

  $('menuTotalHT').textContent = totalHT.toFixed(2)
  $('menuTotalTTC').textContent = totalTTC.toFixed(2)
}


function handleAddMeal(): void {
  const name = $input('mealName').value.trim()
  const calories = parseInt($input('mealCalories').value)
  const price = parseFloat($input('mealPrice').value)

  if (!name || isNaN(calories) || isNaN(price)) {
    alert('Veuillez remplir tous les champs correctement.')
    return
  }

  const draft: MealDraft = { name, calories, price }
  const meal = addLocalMeal(draft)

  if (meal) {
    allMeals.push(meal)
    renderMeals(allMeals)
    $input('mealName').value = ''
    $input('mealCalories').value = ''
    $input('mealPrice').value = ''
  }
}

function getOrCreateSection(id: string, title: string): HTMLElement {
  let section = document.getElementById(id)
  if (!section) {
    const wrapper = document.createElement('div')
    wrapper.className = 'col-12 mt-4'
    wrapper.innerHTML = `
      <div class="card shadow">
        <div class="card-body">
          <h5 class="card-title">${title}</h5>
          <div id="${id}"></div>
        </div>
      </div>
    `
    document.querySelector('.row')?.appendChild(wrapper)
    section = document.getElementById(id)!
  }
  return section
}

async function init(): Promise<void> {
  const apiMeals = await fetchMeals()
  allMeals = [...apiMeals, ...getLocalMeals()]
  renderMeals(allMeals)

  renderWallet()
  renderHistory()
  
  $('filterPrice').addEventListener('input', filterMeals)
  $('addMealBtn').addEventListener('click', handleAddMeal)
  $('calculateMenuBtn').addEventListener('click', () => {
    calculateMenu()
    if (menuSelection.length > 0) {
      const order = confirm('Commander ce menu ?')
      if (order) handleOrder(menuSelection)
    }
  })
}

init()