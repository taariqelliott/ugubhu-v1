import { Route, Routes } from "react-router";
import Home from "./routes/Home";
import Upload from "./routes/Upload";
import NavBarLayout from "./components/NavBarLayout";

export default function App() {
  return (
    <Routes>
      <Route element={<NavBarLayout />}>
        <Route index element={<Home />} />
        <Route path="upload" element={<Upload />} />
      </Route>
    </Routes>
  );
}
