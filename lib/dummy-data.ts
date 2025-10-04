export interface Contributor {
  id: string;
  github_username: string;
  email: string;
  avatar_url: string;
  dimensions: {
    code_velocity: number;
    review_quality: number;
    code_stability: number;
    collaboration: number;
    incident_response: number;
    feature_delivery: number;
    documentation: number;
    testing_rigor: number;
    availability: number;
  };
  composite_score: number;
  rank: number;
  top_dimension: string;
}

export const dummyContributors: Contributor[] = [
  {
    id: "1",
    github_username: "kiwicopple",
    email: "paul@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/10214025?v=4",
    dimensions: {
      code_velocity: 78,
      review_quality: 95,
      code_stability: 88,
      collaboration: 91,
      incident_response: 82,
      feature_delivery: 90,
      documentation: 85,
      testing_rigor: 80,
      availability: 92,
    },
    composite_score: 87,
    rank: 1,
    top_dimension: "Review Quality (95)",
  },
  {
    id: "2",
    github_username: "thorwebdev",
    email: "thor@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/1910070?v=4",
    dimensions: {
      code_velocity: 93,
      review_quality: 82,
      code_stability: 85,
      collaboration: 88,
      incident_response: 90,
      feature_delivery: 88,
      documentation: 75,
      testing_rigor: 78,
      availability: 86,
    },
    composite_score: 85,
    rank: 2,
    top_dimension: "Code Velocity (93)",
  },
  {
    id: "3",
    github_username: "saltcod",
    email: "terry@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/870796?v=4",
    dimensions: {
      code_velocity: 72,
      review_quality: 88,
      code_stability: 90,
      collaboration: 85,
      incident_response: 75,
      feature_delivery: 82,
      documentation: 95,
      testing_rigor: 85,
      availability: 80,
    },
    composite_score: 84,
    rank: 3,
    top_dimension: "Documentation (95)",
  },
  {
    id: "4",
    github_username: "j0",
    email: "joel@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/8291514?v=4",
    dimensions: {
      code_velocity: 85,
      review_quality: 78,
      code_stability: 92,
      collaboration: 80,
      incident_response: 88,
      feature_delivery: 85,
      documentation: 70,
      testing_rigor: 90,
      availability: 82,
    },
    composite_score: 83,
    rank: 4,
    top_dimension: "Code Stability (92)",
  },
  {
    id: "5",
    github_username: "awalias",
    email: "ant@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/3829786?v=4",
    dimensions: {
      code_velocity: 80,
      review_quality: 85,
      code_stability: 82,
      collaboration: 90,
      incident_response: 78,
      feature_delivery: 88,
      documentation: 82,
      testing_rigor: 75,
      availability: 85,
    },
    composite_score: 83,
    rank: 5,
    top_dimension: "Collaboration (90)",
  },
  {
    id: "6",
    github_username: "inian",
    email: "inian@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/2155545?v=4",
    dimensions: {
      code_velocity: 75,
      review_quality: 80,
      code_stability: 88,
      collaboration: 78,
      incident_response: 92,
      feature_delivery: 80,
      documentation: 72,
      testing_rigor: 88,
      availability: 78,
    },
    composite_score: 81,
    rank: 6,
    top_dimension: "Incident Response (92)",
  },
  {
    id: "7",
    github_username: "angelico",
    email: "angelico@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/6201407?v=4",
    dimensions: {
      code_velocity: 70,
      review_quality: 82,
      code_stability: 85,
      collaboration: 75,
      incident_response: 80,
      feature_delivery: 90,
      documentation: 78,
      testing_rigor: 82,
      availability: 76,
    },
    composite_score: 80,
    rank: 7,
    top_dimension: "Feature Delivery (90)",
  },
  {
    id: "8",
    github_username: "soedirgo",
    email: "soedirgo@supabase.io",
    avatar_url: "https://avatars.githubusercontent.com/u/13822507?v=4",
    dimensions: {
      code_velocity: 68,
      review_quality: 78,
      code_stability: 80,
      collaboration: 82,
      incident_response: 75,
      feature_delivery: 85,
      documentation: 88,
      testing_rigor: 95,
      availability: 72,
    },
    composite_score: 80,
    rank: 8,
    top_dimension: "Testing Rigor (95)",
  },
];
