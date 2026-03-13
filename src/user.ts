import { Meal, Order } from './meals.js'

export class TropPauvreErreur extends Error {
  public solde: number
  public prixCommande: number

  constructor(message: string, solde: number, prixCommande: number) {
    super(message)
    this.name = 'TropPauvreErreur'
    this.solde = solde
    this.prixCommande = prixCommande
  }
}

export type Wallet = {
  label: string
  balance: number
}

const STORAGE_KEY = 'uberscript_orders'

export class User {
  id: number
  name: string
  wallets: Wallet[]
  orders: Order[]
  private nextOrderId: number

  constructor(id: number, name: string, initialBalance: number) {
    this.id = id
    this.name = name
    this.wallets = [{ label: 'Principal', balance: initialBalance }]
    this.orders = this.loadOrders()
    this.nextOrderId = this.orders.length > 0
      ? Math.max(...this.orders.map(o => o.id)) + 1
      : 1
  }

  get totalBalance(): number {
    return this.wallets.reduce((sum, w) => sum + w.balance, 0)
  }

  addWallet(label: string, balance: number): void {
    this.wallets.push({ label, balance })
  }

  orderMeal(meal: Meal): Order {
    return this.orderMeals([meal])
  }

  orderMeals(meals: Meal[]): Order {
    const total = meals.reduce((sum, m) => sum + m.price, 0)

    if (this.totalBalance < total) {
      throw new TropPauvreErreur(
        `Fonds insuffisants — Solde: ${this.totalBalance.toFixed(2)}€, Commande: ${total.toFixed(2)}€`,
        this.totalBalance,
        total
      )
    }

    let soldeRestant = total
    for (const wallet of this.wallets) {
      if (soldeRestant <= 0) break
      const deduct = Math.min(wallet.balance, soldeRestant)
      wallet.balance -= deduct
      soldeRestant -= deduct
    }

    const order: Order = {
      id: this.nextOrderId++,
      meals: [...meals],
      total,
    }

    this.orders.push(order)
    this.saveOrders()
    return order
  }

  cancelOrder(orderId: number): boolean {
    const index = this.orders.findIndex(o => o.id === orderId)
    if (index === -1) return false

    const order = this.orders[index]
    this.wallets[0].balance += order.total
    this.orders.splice(index, 1)
    this.saveOrders()
    return true
  }

  totalSpent(): number {
    return this.orders.reduce((sum, o) => sum + o.total, 0)
  }

  private saveOrders(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders))
  }

  private loadOrders(): Order[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return JSON.parse(raw) as Order[]
    } catch {
      return []
    }
  }
}