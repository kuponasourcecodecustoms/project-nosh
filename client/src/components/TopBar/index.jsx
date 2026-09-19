import styles from './styles.module.css'

const logo = '/img/NoshLogo.png'

export default function TopBar() {
  return (
    <header className={styles.topbar}>
      <img src={logo} alt="Nosh" className={`${styles.brandLogo} ${styles.topbarLogo}`} />
    </header>
  )
}
