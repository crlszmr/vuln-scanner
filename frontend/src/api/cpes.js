import { API_ROUTES } from "@/config/apiRoutes";

export async function deleteAllCPEs(password) {
    const response = await fetch(API_ROUTES.NVD.CPE_DELETE_ALL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
    });
    if (!response.ok) throw new Error("Error deleting CPEs");
    return response.json();
}

export async function listCPEs() {
    const response = await fetch(API_ROUTES.NVD.CPE_LIST, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Error listing CPEs");
    return response.json();
}

export async function startCPEImportFromXML() {
    const response = await fetch("http://127.0.0.1:8000/nvd/cpe-import-all-from-xml", {
        method: "POST"
    });
    
    if (!response.ok) {
        throw new Error("Error al importar desde XML");
    }

    return response.json();
}
