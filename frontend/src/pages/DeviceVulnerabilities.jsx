import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageWrapper } from "@/components/layouts/PageWrapper";

const severityLevels = [
  { name: "None", range: [0.0, 0.0], color: "#64748b" },
  { name: "Low", range: [0.1, 3.9], color: "#22c55e" },
  { name: "Medium", range: [4.0, 6.9], color: "#eab308" },
  { name: "High", range: [7.0, 8.9], color: "#f97316" },
  { name: "Critical", range: [9.0, 10.0], color: "#ef4444" },
  { name: "Todas", range: [0.0, 10.0], color: "#3b82f6" },
];

export default function DeviceVulnerabilities() {
  const { id } = useParams();

  return (
    <MainLayout>
      <PageWrapper>
        <h1 className="text-xl font-bold mb-6">Vulnerabilidades del equipo {id}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {severityLevels.map((level) => (
            <div
              key={level.name}
              className="rounded-2xl p-6 text-white cursor-pointer shadow-md"
              style={{ backgroundColor: level.color }}
              onClick={() => alert(`Ver ${level.name} para dispositivo ${id}`)}
            >
              <h2 className="text-lg font-semibold">{level.name}</h2>
              <p className="text-sm mt-2">X vulnerabilidades encontradas</p>
            </div>
          ))}
        </div>
      </PageWrapper>
    </MainLayout>
  );
}
