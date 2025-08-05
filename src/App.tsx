import { Route, Routes } from "react-router";
import NavBarLayout from "./components/NavBarLayout";
import AudioPlayer from "./routes/AudioPlayers";

export default function App() {
  return (
    <Routes>
      <Route element={<NavBarLayout />}>
        <Route index element={<AudioPlayer />} />
      </Route>
    </Routes>
  );
}
