import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";
import { API_ROUTES } from "@/config/apiRoutes";
import axios from "axios";

export default function DeviceConfig() {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(API_ROUTES.DEVICES.DEVICE_CONFIG(deviceId), { withCredentials: true })
      .then((res) => {
        setDevice(res.data);
      })
      .catch((err) => {
        console.error("Error loading device config:", err);
      })
      .finally(() => setLoading(false));
  }, [deviceId]);

  const grouped = {
    o: [],
    h: [],
    a: [],
  };

  if (device?.config) {
    for (const c of device.config) {
      grouped[c.type]?.push(c);
    }
  }

  return (
    <MainLayout>
      <PageWrapper>
        {loading ? (
          <p className="text-muted-foreground">Cargando configuración...</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">{device.alias}</h1>

            {["o", "h", "a"].map((typeKey) => (
              <div key={typeKey} className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  {typeKey === "o" ? "Sistema Operativo" : typeKey === "h" ? "Hardware" : "Aplicaciones"}
                </h2>
                {grouped[typeKey].length === 0 ? (
                  <p className="text-muted-foreground">No hay elementos.</p>
                ) : (
                  <ul className="space-y-2">
                    {grouped[typeKey].map((item, idx) => (
                      <li key={idx} className="border p-3 rounded-xl">
                        <strong>{item.vendor}</strong> - {item.product}
                        {item.version && <> (v{item.version})</>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </PageWrapper>
    </MainLayout>
  );
}
