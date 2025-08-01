import { Route, Routes } from "react-router";
import Home from "./routes/Home";
import About from "./routes/About";
import NavBarLayout from "./components/NavBarLayout";

export default function App() {
  return (
    <Routes>
      <Route element={<NavBarLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
