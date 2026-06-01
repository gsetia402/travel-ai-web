export interface UserPreferenceRequest {
  user_id: string;
  budget: number;
  trip_type: string;
  accommodation: string;
  food_preference: string;
}

export interface MemorySaveResponse {
  message: string;
}

export interface RecommendationRequest {
  user_id: string;
  month: string;
  days: number;
}

export interface DestinationRecommendation {
  destination: string;
  reason: string;
}

export interface RecommendationResponse {
  recommendations: DestinationRecommendation[];
}

export interface TripPlanRequest {
  user_id: string;
  destination: string;
  days: number;
}

export interface WeatherResponse {
  destination: string;
  temperature: number;
  condition: string;
  recommendation: string;
}

export interface CostBreakdown {
  stay: number;
  food: number;
  local_transport: number;
  activities: number;
  miscellaneous: number;
  total: number;
}

export interface BudgetEstimation {
  currency: string;
  cost_breakdown: CostBreakdown;
  budget_status: string;
}

export interface UserPreferences {
  budget: number | null;
  trip_type: string | null;
  accommodation: string | null;
  food_preference: string | null;
}

export interface DayPlan {
  day: number;
  activities: string[];
}

export interface ItineraryResponse {
  destination: string;
  days: number;
  budget: number;
  itinerary: DayPlan[];
}

export interface TripPlanResponse {
  destination: string;
  user_preferences: UserPreferences | null;
  weather: WeatherResponse | null;
  budget_estimation: BudgetEstimation | null;
  itinerary: ItineraryResponse | null;
  travel_advice: string[];
}
