# backend/app/schemas/__init__.py
from .user import UserCreate, UserUpdate
from .vulnerability import VulnerabilityCreate, VulnerabilityUpdate, VulnerabilityResponse
from .platform import PlatformCreate, PlatformResponse
from .cpe_deprecated_by import CpeDeprecatedBy, CpeDeprecatedByCreate
from .device import DeviceCreate, Device, DeviceBase, DeviceConfig, DeviceConfigCreate
from .vulnerability import DetailedVulnerabilityResponse

