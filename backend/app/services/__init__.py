# backend/app/services/__init__.py

from .cve_importer import (
    parse_cves_from_nvd,
    save_cves_to_db,
    import_all_cves_stream,
)

from .cpe_importer import (
    extract_cpes_from_feed_config,
    extract_cpes_from_node,
    download_cpe_xml_if_needed,
    import_cpes_from_xml,
    extract_all_cpes,
    collect_cpes_from_nodes,
)

from .utils import (
    extract_cvss_data_from_feed,
    extract_text,
    extract_multiple_as_json,
    serialize_elements,
    serialize_blocks,
    extract_cvss_data,
    decompress_once,
)

from .cwe_importer import (
    import_all_cwes_stream,
)