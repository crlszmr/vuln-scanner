import axios from "axios";
import { API_ROUTES } from "@/config/apiRoutes";

export const startCVEImport = async () => {
  const response = await axios.post(API_ROUTES.NVD.IMPORT_VULNERABILITIES);
  return response.data;
};

export const startCVEImportFromJSON = async () => {
  const response = await axios.post(API_ROUTES.NVD.IMPORT_CVES_FROM_JSON);
  return response.data;
};