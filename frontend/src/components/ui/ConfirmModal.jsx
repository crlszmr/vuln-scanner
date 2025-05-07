import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  description = "",
}) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
    setPassword(""); // Limpiar al enviar
    onClose(); // Cerrar el modal después de confirmar
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="text-gray-600">{description}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
        <input
          type="password"
          placeholder="Introduce tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end space-x-4 mt-4">
          <Button type="button" onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={!password}>
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
