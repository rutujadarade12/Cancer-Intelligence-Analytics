from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str
    database_connected: bool
    version: str
    project: str
    verified_tables: int

class DashboardSummaryResponse(BaseModel):
    national_cases_2022: float
    total_states_covered: int
    total_cancer_sites: int
    total_registries: int
    national_projected_2026: float
    national_projected_2045: float
    top_states: List[Dict[str, Any]]
    leading_sites_male: List[Dict[str, Any]]
    leading_sites_female: List[Dict[str, Any]]
    regional_distribution: List[Dict[str, Any]]
    data_provenance_notes: List[str]

class StateItem(BaseModel):
    geo_id: int
    state_name: str
    state_code: str
    region_zone: str
    country: str

class CancerSiteItem(BaseModel):
    site_id: int
    site_name: str
    icd10_code: Optional[str] = None
    level_type: Optional[str] = None
    parent_group: Optional[str] = None
    is_tobacco_associated: int
    organ_system_name: Optional[str] = None

class OrganSystemItem(BaseModel):
    organ_system_id: int
    system_name: str
    site_count: int

class StateProjectionItem(BaseModel):
    state_name: str
    region_zone: str
    year: int
    epoch_category: str
    measure_code: str
    incident_cases: float
    national_share_pct: Optional[float] = None
    cagr_observed: Optional[float] = None
    cagr_projected: Optional[float] = None

class MortalityItem(BaseModel):
    state_name: str
    year: int
    reported_incidence: float
    reported_deaths: float
    mortality_incidence_ratio: float
    cancer_type_note: str

class InfrastructureNationalItem(BaseModel):
    infra_id: int
    indicator_name: str
    facility_count: int
    reporting_source: str

class InfrastructureMaharashtraItem(BaseModel):
    mh_infra_id: int
    category: str
    facility_name: str
    facility_count_or_type: str
    source_note: Optional[str] = None

class IncidencePredictionRequest(BaseModel):
    state: Union[str, int] = Field(..., description="State name (e.g. 'Maharashtra') or geo_id (e.g. 27)")
    target_year: int = Field(2026, ge=2019, le=2045, description="Forecast target year between 2019 and 2045")
    growth_adjustment_pct: Optional[float] = Field(0.0, ge=-50.0, le=50.0, description="Annual growth rate shock/adjustment percentage (-50% to +50%)")
    model_type: Optional[str] = Field("bayesian_ridge", description="Model: bayesian_ridge, linear_regression, ridge_regression, gradient_boosting, random_forest")

class IncidencePredictionResponse(BaseModel):
    state_name: str
    state_code: str
    geo_id: int
    region_zone: str
    target_year: int
    predicted_incident_cases: float
    confidence_interval_95: Optional[Dict[str, Any]] = None
    growth_adjustment_pct: float
    model_used: str
    validation_summary: Dict[str, Any]
    trajectory: List[Dict[str, Any]]
    external_reference: Optional[Dict[str, Any]] = None
    provenance_note: str

class ModelBenchmarkResponse(BaseModel):
    evaluation_cohort_size: int
    evaluation_methodology: str
    selected_model: str
    selection_rationale: str
    loocv_metrics: Dict[str, Any]
    in_sample_metrics: Dict[str, Any]
    external_projections_note: str
