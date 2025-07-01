import os

NVD_API_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
NVD_CPE_URL = "https://services.nvd.nist.gov/rest/json/cpes/2.0"
#DATABASE_URL = "postgresql://postgres:42180300Cc@localhost/vuln_scanner_db"
DATABASE_URL = os.getenv("NVD_API_KEY")
CWE_XML_URL = "https://cwe.mitre.org/data/xml/cwec_v4.12.xml.zip"
CWE_XML_PATH = "data/cwec_v4.12.xml"
CWE_ZIP_PATH = "data/cwec_v4.12.xml.zip"
CPE_XML_URL = "https://nvd.nist.gov/feeds/xml/cpe/dictionary/official-cpe-dictionary_v2.3.xml.gz"
CPE_XML_GZ_PATH = "data/cpe-dictionary.xml.gz"
CPE_XML_PATH = "data/cpe-dictionary.xml"

