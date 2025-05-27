import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/config/appRoutes";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import { API_ROUTES } from "@/config/apiRoutes";

export default function DevicesList() {
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(API_ROUTES.DEVICES.MY_DEVICES, { withCredentials: true })
      .then(res => {
        console.log("📦 Devices:", res.data); // ← Log de depuración
        setDevices(res.data);
      })
      .catch(err => console.error("Error loading devices:", err));
  }, []);

  return (
    <MainLayout>
      <PageWrapper>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mis equipos</h1>
          <Button onClick={() => navigate(APP_ROUTES.DEVICE_UPLOAD)}>Crear nuevo equipo</Button>
        </div>

        {devices.length === 0 ? (
          <p className="text-muted-foreground">Aún no tienes ningún equipo registrado.</p>
        ) : (
          <div className="grid gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="border p-4 rounded-xl shadow cursor-pointer hover:bg-muted"
                onClick={() => navigate(APP_ROUTES.DEVICE_CONFIG(device.id))}
              >
                <h2 className="text-xl font-semibold">{device.alias}</h2>
                <p className="text-sm text-muted-foreground">
                  Tipo: {device.type} · SO: {device.os_name} · Apps instaladas: {device.config?.filter(c => c.type === "a").length ?? 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </PageWrapper>
    </MainLayout>
  );
}
