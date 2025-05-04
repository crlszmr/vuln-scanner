export async function getCPEImportStatus() {
    const response = await fetch("/api/nvd/cpe-import-status");
    if (!response.ok) throw new Error("Error fetching import status");
    return response.json();
}

export async function startCPEImport() {
    const response = await fetch("/api/nvd/cpe-import-all", { method: "POST" });
    if (!response.ok) throw new Error("Error starting import");
    return response.json();
}

export async function cancelCPEImport() {
    const response = await fetch("/api/nvd/cpe-import-cancel", { method: "POST" });
    if (!response.ok) throw new Error("Error cancelling import");
    return response.json();
}

export async function deleteAllCPEs(password) {
    const response = await fetch("/api/nvd/cpe-delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });
    if (!response.ok) throw new Error("Error deleting CPEs");
    return response.json();
}

export async function listCPEs() {
    const response = await fetch("/api/nvd/cpe-list");
    if (!response.ok) throw new Error("Error listing CPEs");
    return response.json();
}
