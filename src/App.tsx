import { lazy, Suspense } from 'react'
import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { AppShell, Wordmark } from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { useApplyTheme } from '@/lib/theme'
import { useHydrated } from '@/store/hooks'
import { TodayScreen } from '@/screens/TodayScreen'

const RecipeScreen = lazy(() => import('@/screens/RecipeScreen'))
const CookScreen = lazy(() => import('@/screens/CookScreen'))
const PrepScreen = lazy(() => import('@/screens/PrepScreen'))
const SessionScreen = lazy(() => import('@/screens/SessionScreen'))
const StockScreen = lazy(() => import('@/screens/StockScreen'))
const ShopScreen = lazy(() => import('@/screens/ShopScreen'))
const WeightScreen = lazy(() => import('@/screens/WeightScreen'))
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'))

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" aria-busy="true" aria-label="Загрузка">
      <Wordmark />
    </div>
  )
}

export default function App() {
  useApplyTheme()
  const hydrated = useHydrated()
  if (!hydrated) return <Splash />

  return (
    <Router hook={useHashLocation}>
      <AppShell>
        <Suspense fallback={null}>
          <Switch>
            <Route path="/" component={TodayScreen} />
            <Route path="/recipe/:date/:slot/cook">{(p) => <CookScreen kind="recipe" date={p.date} slot={p.slot} />}</Route>
            <Route path="/recipe/:date/:slot">{(p) => <RecipeScreen date={p.date} slot={p.slot} />}</Route>
            <Route path="/prep/:sid/cook">{(p) => <CookScreen kind="session" sid={p.sid} />}</Route>
            <Route path="/prep/:sid">{(p) => <SessionScreen sid={p.sid} />}</Route>
            <Route path="/prep" component={PrepScreen} />
            <Route path="/stock" component={StockScreen} />
            <Route path="/shop" component={ShopScreen} />
            <Route path="/weight" component={WeightScreen} />
            <Route path="/settings" component={SettingsScreen} />
            <Route>
              <TodayScreen />
            </Route>
          </Switch>
        </Suspense>
      </AppShell>
      <Toaster />
    </Router>
  )
}
