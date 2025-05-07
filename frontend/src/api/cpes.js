import { API_ROUTES } from "@/config/apiRoutes";

export async function getCPEImportStatus() {
    const response = await fetch(API_ROUTES.NVD.CPE_IMPORT_STATUS, {
        credentials: "include",
    });
    if (!response.ok) throw new Error("Error fetching import status");
    return response.json();
}

export async function startCPEImport() {
    const response = await fetch(API_ROUTES.NVD.IMPORT_PLATFORMS, {
        method: "POST",
        credentials: "include",
    });
    if (!response.ok) throw new Error("Error starting import");
    return response.json();
}

export async function cancelCPEImport() {
    const response = await fetch(API_ROUTES.NVD.CPE_IMPORT_CANCEL, {
        method: "POST",
        credentials: "include",
    });
    if (!response.ok) throw new Error("Error cancelling import");
    return response.json();
}

export async function deleteAllCPEs(password) {
    const response = await fetch(API_ROUTES.NVD.CPE_DELETE_ALL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include", // 👈 ya estaba perfecto
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
