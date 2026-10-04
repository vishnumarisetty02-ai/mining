"""Subsidiary identifiers for Coal India multi-tenancy (R13)."""

from enum import StrEnum


class SubsidiaryId(StrEnum):
    """Coal India subsidiary identifiers used as RLS tenant keys."""

    ECL = "ECL"    # Eastern Coalfields Limited
    BCCL = "BCCL"  # Bharat Coking Coal Limited
    CCL = "CCL"    # Central Coalfields Limited
    WCL = "WCL"    # Western Coalfields Limited
    SECL = "SECL"  # South Eastern Coalfields Limited
    MCL = "MCL"    # Mahanadi Coalfields Limited
    NCL = "NCL"    # Northern Coalfields Limited
    CMPDI = "CMPDI"  # Central Mine Planning & Design Institute
