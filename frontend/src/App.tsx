import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import DriverStandings from './pages/DriverStandings'
import ConstructorStandings from './pages/ConstructorStandings'
import Calendar from './pages/Calendar'
import RaceDetail from './pages/RaceDetail'
import PitstopAnalysis from './pages/PitstopAnalysis'
import Predictions from './pages/Predictions'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 min
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="drivers" element={<DriverStandings />} />
            <Route path="constructors" element={<ConstructorStandings />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="race/:year/:round" element={<RaceDetail />} />
            <Route path="pitstops" element={<PitstopAnalysis />} />
            <Route path="predictions" element={<Predictions />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
