import { useLayoutEffect } from 'react'
import { useRoute } from './router'
import { Inventory } from './screens/Inventory'
import { ItemDetail } from './screens/ItemDetail'
import { Catalogue } from './screens/catalogue/Catalogue'
import { Status } from './screens/Status'
import { Home } from './screens/day/Home'
import { Choices } from './screens/day/Choices'
import { Day } from './screens/day/Day'

export function App() {
  const route = useRoute()

  // Every screen opens at the top; the Inventory restores its own scroll position.
  useLayoutEffect(() => {
    if (route.name !== 'inventory') window.scrollTo(0, 0)
  }, [route])
  return (
    <div className="app">
      {route.name === 'inventory' && <Inventory />}
      {route.name === 'lot' && <ItemDetail key={route.id} id={route.id} />}
      {route.name === 'scan' && <Catalogue />}
      {route.name === 'status' && <Status />}
      {route.name === 'home' && <Home />}
      {route.name === 'choices' && <Choices />}
      {route.name === 'day' && <Day />}
    </div>
  )
}
