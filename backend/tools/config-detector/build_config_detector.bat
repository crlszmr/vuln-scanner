@echo off
cd /d %~dp0

echo 🛠️ Generando ejecutable ConfigDetector.exe...
pyinstaller --onefile --windowed --icon=config.ico --name=ConfigDetector config_detector_gui.py

IF EXIST dist\ConfigDetector.exe (
    echo ✅ Ejecutable generado correctamente.
    echo 🔁 Copiando a frontend/public...

    REM Copia al frontend/public (ajustar esta ruta si es necesario)
    copy /Y dist\ConfigDetector.exe ..\..\..\frontend\public\ConfigDetector.exe >nul

    IF EXIST ..\..\..\frontend\public\ConfigDetector.exe (
        echo 🎉 Ejecutable disponible en frontend/public.
    ) ELSE (
        echo ❌ No se pudo copiar a frontend/public. Verifica la ruta.
    )
) ELSE (
    echo ❌ Error: No se generó dist\ConfigDetector.exe
)

pause