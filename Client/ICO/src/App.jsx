import WalletConnection from './components/WalletConnection';
import ICOStats from './components/ICOStats';
import ICOPurchase from './components/ICOPurchase';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <img src="/vite.png" alt="MOTRA Logo" className="logo-image" />
              <h1 className="logo-title">MOTRA</h1>
              <p className="logo-subtitle">
                Web3 Fitness Platform
              </p>
            </div>
            <WalletConnection />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="hero-section">
            <h1 className="hero-title">
              Join the Future of Fitness
            </h1>
            <p className="hero-description">
              Get MOTRA tokens and be part of the revolutionary Web3 fitness ecosystem. 
              Earn rewards for staying healthy and achieving your fitness goals.
            </p>
          </div>

          <div className="ico-container">
            <ICOStats />
            <ICOPurchase />
          </div>

          <div className="features-section">
            <h2 className="features-title">Why Choose MOTRA?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🏃‍♂️</div>
                <h3>Earn While You Exercise</h3>
                <p>Get rewarded with MOTRA tokens for completing workouts and achieving fitness milestones.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Gamified Fitness</h3>
                <p>Turn your fitness journey into an engaging game with challenges, leaderboards, and achievements.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔗</div>
                <h3>Web3 Integration</h3>
                <p>Own your fitness data and achievements on the blockchain. True ownership of your progress.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            © 2024 MOTRA. Building the future of Web3 fitness.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
