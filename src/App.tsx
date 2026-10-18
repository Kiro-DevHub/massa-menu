import { Route, Router, Switch } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import { AppShell, Wordmark } from '@/components/AppShell'
import { Toaster } from '@/components/ui/sonner'
import { useApplyTheme } from '@/lib/theme'
import { useHydrated } from '@/store/hooks'
import { TodayScreen } from '@/screens/TodayScreen'
import CookScreen from '@/screens/CookScreen'
import PrepScreen from '@/screens/PrepScreen'
import RecipeScreen from '@/screens/RecipeScreen'
import SessionScreen from '@/screens/SessionScreen'
import SettingsScreen from '@/screens/SettingsScreen'
import ShopScreen from '@/screens/ShopScreen'
import StockScreen from '@/screens/StockScreen'
import WeightScreen from '@/screens/WeightScreen'

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
      </AppShell>
      <Toaster />
    </Router>
  )
}
