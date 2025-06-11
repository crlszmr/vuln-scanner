import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import threading
import config_getter_module as config_getter
import os

def run_detection():
    def task():
        try:
            progress_bar.pack(pady=5)
            progress_label.config(text="Procesando...")
            button.config(state="disabled")
            progress_bar.start()
            config_getter.generate_system_config()
            progress_bar.stop()
            messagebox.showinfo("Éxito", "✔️ Archivo 'system_config.json' generado correctamente.")
        except Exception as e:
            progress_bar.stop()
            messagebox.showerror("Error", f"Ocurrió un error: {str(e)}")
        finally:
            button.config(state="normal")
            progress_label.config(text="")
            progress_bar.pack_forget()

    threading.Thread(target=task).start()

# Crear ventana principal
root = tk.Tk()
root.title("Detector de Configuración")
root.resizable(False, False)

# Establecer icono personalizado (.ico debe estar en la misma carpeta o embebido en el .exe)
try:
    root.iconbitmap("config.ico")
except Exception:
    pass

# Posicionarla centrada
window_width, window_height = 420, 220
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()
x_coord = int((screen_width / 2) - (window_width / 2))
y_coord = int((screen_height / 2) - (window_height / 2))
root.geometry(f"{window_width}x{window_height}+{x_coord}+{y_coord}")

# Etiqueta de instrucciones
label = tk.Label(root, text="Haz clic en el botón para generar la configuración del sistema:", wraplength=380, justify="center", font=("Arial", 10))
label.pack(pady=20)

# Botón
button = tk.Button(root, text="Generar configuración", command=run_detection, font=("Arial", 12), bg="#2563eb", fg="white", padx=20, pady=10)
button.pack(pady=10)

# Crear barra de progreso pero no mostrarla hasta hacer clic
progress_bar = ttk.Progressbar(root, mode="indeterminate", length=200)

# Texto de estado
progress_label = tk.Label(root, text="", font=("Arial", 9), fg="gray")
progress_label.pack()

root.mainloop()
