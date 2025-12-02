import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ExplorarPage from "../pages/ExplorarPage";
import ProductosPage from "../pages/ProductosPage";
import NoticiasPage from "../pages/NoticiasPage";
import CartPage from "../pages/CartPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Users from "../pages/Users";
import Dashboard from "../pages/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explorar" element={<ExplorarPage />} />
      <Route path="/productos" element={<ProductosPage />} />
      <Route path="/noticias" element={<NoticiasPage />} />
      <Route path="/carrito" element={<CartPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />
      <Route path="/usuarios" element={<Users />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
