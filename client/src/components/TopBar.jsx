import logo from '../img/Nosh Logo.png'

export default function TopBar() {
  return (
    <header className="topbar">
      <img src={logo} alt="Nosh" className="brand-logo topbar-logo" />
    </header>
  )
}
