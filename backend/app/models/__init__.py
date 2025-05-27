# backend/app/models/__init__.py
from .user import User
from .vulnerability import Vulnerability
from .platform import Platform
from .cpe_title import CpeTitle
from .device import Device
from .device_config import DeviceConfig
from .platform import Platform
from .cpe_title import CpeTitle
from .cpe_deprecated_by import CpeDeprecatedBy
from .cpe_reference import CPEReference  # 👈 MUY IMPORTANTE
from .vulnerability import Vulnerability
from .weakness import Weakness
from .user import User
from app.models.device_match import DeviceMatch
