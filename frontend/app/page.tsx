import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.landing}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          ChatVerse
        </div>
        <Link href="/chat">
          <button className={styles.btnSecondary} id="nav-get-started">
            Open App →
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot}></span>
          Real-time messaging
        </div>

        <h1 className={styles.heroTitle}>
          Chat with anyone,
          <br />
          <span className={styles.gradientText}>anywhere, instantly.</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Create rooms, invite friends, and start chatting in real-time.
          No sign-up required — just pick a username and go.
        </p>

        <div className={styles.heroActions}>
          <Link href="/chat">
            <button className={styles.btnPrimary} id="hero-start-chatting">
              ✨ Start Chatting
            </button>
          </Link>
          <button className={styles.btnSecondary} id="hero-learn-more">
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🚀</div>
          <h3 className={styles.featureTitle}>Instant Rooms</h3>
          <p className={styles.featureDesc}>
            Create a room in one click. Share the name and start collaborating immediately.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>⚡</div>
          <h3 className={styles.featureTitle}>Real-time Chat</h3>
          <p className={styles.featureDesc}>
            Messages delivered instantly via WebSocket. No delays, no refreshing needed.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>🔓</div>
          <h3 className={styles.featureTitle}>No Login Needed</h3>
          <p className={styles.featureDesc}>
            Jump right in with just a username. No accounts, no passwords, no friction.
          </p>
        </div>
      </section>
    </main>
  );
}
