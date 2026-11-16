import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRoutes } from "./routes/AppRoutes";
import { Providers } from "./app/Providers";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <AppRoutes />
    </Providers>
  </StrictMode>,
);
