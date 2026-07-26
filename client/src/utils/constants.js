export const EVENT_NAME = "IEEE RAS x IEEE CS Hackathon";
export const EVENT_DATE = "2026-08-19T10:00:00+05:30";
function normalizeApiBaseUrl(value) {
  const baseUrl = String(value || "").trim().replace(/\/$/, "");

  if (!baseUrl) {
    return "http://localhost:8080/api";
  }

  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const ORGANIZER_LOGOS = [
  {
    name: "College",
    shortName: "CLG",
    src: "/logos/college-logo.png"
  },
  {
    name: "IEEE RAS",
    shortName: "RAS",
    src: "/logos/ieee-ras-logo.png"
  },
  {
    name: "IEEE CS",
    shortName: "CS",
    src: "/logos/ieee-cs-logo.jpg"
  }
];

export const BRANCH_OPTIONS = ["CSE", "CSE-DS", "CSE-CS", "AIML", "IT"];
export const YEAR_OPTIONS = ["3rd year", "4th year"];
export const BRANCH_SECTION_LIMITS = {
  CSE: 20,
  AIML: 15,
  "CSE-DS": 5,
  "CSE-CS": 5,
  IT: 3
};

export function getSectionOptionsForBranch(branch) {
  const count = BRANCH_SECTION_LIMITS[branch] || 1;
  return Array.from({ length: count }, (_, index) => String(index + 1));
}

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" }
];

export const PRIMARY_STATS = [
  { label: "Target Capacity", value: "200+" },
  { label: "Expected Participants", value: "120" },
  { label: "Event Duration", value: "2 Days" },
  { label: "Prize Pool", value: "INR 4,500" }
];

export const PRIZE_BREAKDOWN = [
  { title: "1st Prize", amount: "INR 2,000" },
  { title: "2nd Prize", amount: "INR 1,500" },
  { title: "3rd Prize", amount: "INR 1,000" }
];

export const SPECIAL_AWARDS = [
  "Best Innovation Award",
  "Best Technical Excellence Award",
  "Best UI/UX Design Award",
  "Jury's Choice Award"
];

export const MANAGEMENT_TEAM = [
  {
    name: "Sushanth P V",
    role: "Technical Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Aarav Menon",
    role: "Event Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Nisha Iyer",
    role: "Registration Head",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Rahul Dev",
    role: "Sponsorship Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Kavin M",
    role: "Technical Operations",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Priya S",
    role: "Marketing & Outreach",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Aditya R",
    role: "Logistics Coordinator",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Harini K",
    role: "Volunteer Coordinator",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Manoj V",
    role: "Web Operations",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Sneha R",
    role: "Design Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Arjun P",
    role: "Sponsorship Coordinator",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Keerthana M",
    role: "Hospitality Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Naveen S",
    role: "Stage & Venue Operations",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Divya T",
    role: "Content & Communications",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Vishal N",
    role: "Mentor Relations",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Bhavana L",
    role: "Registration Operations",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Sriram K",
    role: "Technical Support",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/"
  },
  {
    name: "Aishwarya D",
    role: "Media & Documentation",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/"
  }
];
