import React, { createContext, useContext, useEffect, useReducer } from 'react'

// Challenge: { id, title, category, points, steps: string[], description }

const initialData = {
  user: { name: 'You', xp: 0, coins: 0, streak: 0 },
  activeTab: 'Home',
  completed: {}, // id -> true
  comments: [
    { id: 'c1', user: 'Alex', text: 'Anyone wants to meal-prep on Sunday?', createdAt: Date.now()-86400000 },
    { id: 'c2', user: 'Maya', text: 'Budgeting worksheet was super helpful!', createdAt: Date.now()-3600000 }
  ],
  challenges: [
    {
      id: 'ch1',
      title: 'Cook a 3-ingredient dinner',
      category: 'Cooking',
      points: 20,
      steps: ['Pick a protein', 'Add a veggie', 'Add a carb'],
      description: 'Keep it simple and tasty. Share a pic once done!'
    },
    {
      id: 'ch2',
      title: 'Track expenses for 3 days',
      category: 'Budgeting',
      points: 30,
      steps: ['List income', 'Record each purchase', 'Review patterns'],
      description: 'Use any notes app or paper. Awareness first.'
    },
    {
      id: 'ch3',
      title: '30 min walk + stretch',
      category: 'Exercise',
      points: 15,
      steps: ['10 min warm-up walk', '10 min brisk walk', '10 min stretch'],
      description: 'Low impact movement to keep momentum.'
    },
    {
      id: 'ch4',
      title: 'Plan a social check-in',
      category: 'Social',
      points: 15,
      steps: ['Pick a friend', 'Text to set time', 'Do a 10-min call'],
      description: 'Small moments, big effect.'
    }
  ],
  resources: [
    { id: 'r1', title: 'Budgeting Basics (5 min read)', url: '#', tag: 'Budgeting' },
    { id: 'r2', title: 'One-Pan Dinners', url: '#', tag: 'Cooking' },
    { id: 'r3', title: 'Set a Habit Cue', url: '#', tag: 'Habits' }
  ]
}

const Store = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.payload
    case 'tab':
      return { ...state, activeTab: action.tab }
    case 'complete':
      if (state.completed[action.id]) return state
      const newXP = state.user.xp + action.points
      const newCoins = state.user.coins + Math.ceil(action.points / 10)
      const today = new Date().toDateString()
      const lastPlayed = localStorage.getItem('momentum:lastPlayed')
      const streak = lastPlayed && new Date(lastPlayed).toDateString() === new Date(Date.now()-86400000).toDateString()
        ? state.user.streak + 1
        : (lastPlayed === today ? state.user.streak : 1)
      localStorage.setItem('momentum:lastPlayed', today)
      return {
        ...state,
        user: { ...state.user, xp: newXP, coins: newCoins, streak },
        completed: { ...state.completed, [action.id]: true }
      }
    case 'comment':
      return { ...state, comments: [...state.comments, action.comment] }
    case 'reset':
      localStorage.removeItem('momentum:state')
      localStorage.removeItem('momentum:lastPlayed')
      return initialData
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialData)

  useEffect(() => {
    const raw = localStorage.getItem('momentum:state')
    if (raw) dispatch({ type: 'hydrate', payload: JSON.parse(raw) })
  }, [])

  useEffect(() => {
    localStorage.setItem('momentum:state', JSON.stringify(state))
  }, [state])

  return <Store.Provider value={{ state, dispatch }}>{children}</Store.Provider>
}

export function useStore() {
  const ctx = useContext(Store)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
