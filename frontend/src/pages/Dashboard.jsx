import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <PageWrapper>
        <div className="flex flex-col items-center justify-center h-full text-center gap-6">
          <h1 className="text-3xl font-bold">Bienvenido</h1>
          <p className="text-lg text-muted-foreground">Empieza a gestionar tus dispositivos</p>
          <Button className="text-lg px-6 py-3" onClick={() => navigate("/devices/list")}>
            Mis equipos
          </Button>
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
