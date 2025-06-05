
import json
import platform
import psutil
import subprocess
import re
import winreg
import os
import win32api

CREATE_NO_WINDOW = subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0

def get_hardware_info():
    hardware = []

    cpu_vendor = platform.processor()
    cpu_name = platform.uname().processor
    hardware.append({
        "vendor": cpu_vendor if cpu_vendor else "Unknown",
        "product": cpu_name if cpu_name else "Unknown",
        "version": ""
    })

    mem = psutil.virtual_memory()
    hardware.append({
        "vendor": "Generic",
        "product": "RAM",
        "version": f"{round(mem.total / (1024 ** 3))} GB"
    })

    return hardware

def get_os_info():
    try:
        reg_key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows NT\CurrentVersion")
        product_name = winreg.QueryValueEx(reg_key, "ProductName")[0]
        display_version = winreg.QueryValueEx(reg_key, "DisplayVersion")[0]
        build_number = int(winreg.QueryValueEx(reg_key, "CurrentBuild")[0])
        winreg.CloseKey(reg_key)

        if "Windows 10" in product_name and build_number >= 22000:
            product_name = product_name.replace("Windows 10", "Windows 11")

        os_info = [{
            "vendor": "Microsoft",
            "product": product_name,
            "version": display_version
        }]

        return os_info

    except Exception:
        return [{
            "vendor": "Microsoft",
            "product": "Windows",
            "version": "Unknown"
        }]

def get_installed_software_registry(hive):
    applications = []

    reg_paths = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]

    for reg_path in reg_paths:
        try:
            reg_key = winreg.OpenKey(hive, reg_path)
            for i in range(0, winreg.QueryInfoKey(reg_key)[0]):
                sub_key_name = winreg.EnumKey(reg_key, i)
                sub_key = winreg.OpenKey(reg_key, sub_key_name)
                try:
                    display_name = winreg.QueryValueEx(sub_key, "DisplayName")[0]
                    if not display_name or display_name.strip() == "-" or len(display_name.strip()) < 3:
                        continue

                    display_version = winreg.QueryValueEx(sub_key, "DisplayVersion")[0] if 'DisplayVersion' in [winreg.EnumValue(sub_key, j)[0] for j in range(winreg.QueryInfoKey(sub_key)[1])] else ""
                    publisher = winreg.QueryValueEx(sub_key, "Publisher")[0] if 'Publisher' in [winreg.EnumValue(sub_key, j)[0] for j in range(winreg.QueryInfoKey(sub_key)[1])] else "Unknown"

                    applications.append({
                        "vendor": publisher,
                        "product": display_name,
                        "version": display_version
                    })
                except Exception:
                    pass
                finally:
                    winreg.CloseKey(sub_key)
        except Exception:
            pass

    return applications

def get_installed_software_powershell():
    applications = []
    try:
        result = subprocess.run(
            ["powershell", "Get-WmiObject -Class Win32_Product | Select-Object Name, Version, Vendor"],
            capture_output=True,
            text=True,
            creationflags=CREATE_NO_WINDOW
        )
        lines = result.stdout.splitlines()

        for line in lines:
            parts = re.split(r'\s{2,}', line.strip())
            if len(parts) >= 3 and parts[0] != "Name":
                if not parts[0] or parts[0].strip() == "-" or len(parts[0].strip()) < 3:
                    continue

                applications.append({
                    "vendor": parts[2] if parts[2] else "Unknown",
                    "product": parts[0],
                    "version": parts[1] if len(parts) > 1 else ""
                })
    except Exception:
        pass

    return applications

def get_exe_vendor(path_to_exe):
    try:
        info = win32api.GetFileVersionInfo(path_to_exe, '\\StringFileInfo\\040904b0\\CompanyName')
        return info
    except Exception:
        return "Unknown"

def enhance_with_exe_vendor(applications):
    for app in applications:
        if app["vendor"] == "Unknown":
            exe_name = app["product"] + ".exe"
            for path in os.environ["PATH"].split(os.pathsep):
                exe_path = os.path.join(path, exe_name)
                if os.path.isfile(exe_path):
                    vendor = get_exe_vendor(exe_path)
                    app["vendor"] = vendor
                    break
    return applications

def filter_applications(apps):
    filtered = []
    for app in apps:
        if any([app["product"].strip() == "----", len(app["product"].strip()) < 3]):
            continue
        if app["vendor"].startswith("Google\\Chrome"):
            continue
        filtered.append(app)
    return filtered

def get_installed_software():
    apps_registry_machine = get_installed_software_registry(winreg.HKEY_LOCAL_MACHINE)
    apps_registry_user = get_installed_software_registry(winreg.HKEY_CURRENT_USER)
    apps_powershell = get_installed_software_powershell()

    all_apps = { (app["product"], app["version"]): app for app in apps_registry_machine }

    for app in apps_registry_user + apps_powershell:
        key = (app["product"], app["version"])
        if key not in all_apps:
            all_apps[key] = app

    apps_list = list(all_apps.values())
    apps_list = enhance_with_exe_vendor(apps_list)
    apps_list = filter_applications(apps_list)

    return apps_list

def generate_system_config():
    system_config = {
        "hardware": get_hardware_info(),
        "os": get_os_info(),
        "applications": get_installed_software()
    }

    with open("system_config.json", "w", encoding="utf-8") as f:
        json.dump(system_config, f, indent=4, ensure_ascii=False)

    print("✔️ Archivo system_config.json generado con éxito.")

if __name__ == "__main__":
    generate_system_config()
