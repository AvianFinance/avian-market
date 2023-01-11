import { Outlet, Link } from "react-router-dom";
import LogoSrc from "../img/logo.png";

function Layout() {
  return (
    <div id="layout">
      <div className="menu-container"  style={{ backgroundColor:"#ADD8E6" }}>
        <div className="logo-container">
          <img className="logo" src={LogoSrc} alt="Truffle logo" />
        </div>
        <ul>
          <Link to="/market"><li>Rental Market</li></Link>
          <Link to="/owned"><li>Owned NFTs</li></Link>
          <Link to="/rented"><li>Rented NFTs</li></Link>
          <Link to="/mintnft"><li>Mint NFTs</li></Link>
        </ul>
      </div>
      <div className="page-container" style={{ padding: "20px"}}>
        <Outlet />
      </div>
    </div>
  );
}

export { Layout };
