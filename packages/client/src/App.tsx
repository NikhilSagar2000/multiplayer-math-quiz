import { GameProvider, useGame } from './context/GameContext';
import { JoinScreen } from './components/JoinScreen';
import { QuizScreen } from './components/QuizScreen';

function AppContent() {
  const { user } = useGame();

  if (!user) {
    return <JoinScreen />;
  }

  return <QuizScreen />;
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
