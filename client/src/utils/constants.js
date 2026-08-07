export const EVENT_NAME = "IEEE RAS x IEEE CS Hackathon";
export const EVENT_DATE = "2026-09-21T10:00:00+05:30";
export const REGISTRATION_CAPACITY = 140;
export const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/FrJNyMIjzkB3mNs6Dgg9qc?s=sw&p=a&mlu=4";

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
  { label: "Target Capacity", value: "120" },
  { label: "Expected Participants", value: "100" },
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
    name: "K Chedhitha",
    role: "Chair",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/chedhitha-chowdary-kothapalli-830465296/",
    github: "https://github.com/chedhitha"
  },
  {
    name: "M Gayathri",
    role: "Vice Chair",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/gayathri-madduri-2406a6334/",
    github: "https://github.com/Gayathrimadduri"
  },
  {
    name: "M Bhavishya",
    role: "Secretary",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/madichetty-bhavishya-501b87342",
    github: "https://github.com/Bhavishya-2005"
  },
  {
    name: "N Deepthi",
    role: "Member",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/nagabhushigari-deepthi-0a0382343/",
    github: "https://github.com/NagabhushigariDeepthi"
  },
  {
    name: "Syed Shainaj",
    role: "Member",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/syed-shainaj-244383343/",
    github: "https://github.com/SyedShainaj"
  },
  {
    name: "G Niharika",
    role: "Member",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/gaddapara-niharika-reddy-b357b0313",
    github: "https://github.com/niharika-1411"
  },
  {
    name: "A Vamsieswar",
    role: "Web Master",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/vamsieswar-aari-b54a65342?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    
  },
  {
    name: "A Dimpull",
    role: "Treasurer",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/dimpull-chowdary-2b8120325?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    
  },
  {
    name: "Mallikarjun",
    role: "Web Master",
    chapter: "IEEE RAS",
    
  },
  {
    name: "Sushanth P V",
    role: "Technical & Registration Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/sushanth-p-v-67290a31b/",
    github: "https://github.com/SUSHANTHPVS"
  },
  {
    name: "K Nava Chaitanya",
    role: "Chair",
    chapter: "IEEE CS",
    
  },
  {
    name: "V Babitha",
    role: "Vice Chair",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/in/babitha-v-a4b5893ab?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    
  },
  {
    name: "B Himaya Sree",
    role: "Secretary",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/in/bandaru-himaya-sree-b014a22a6?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    github: "https://github.com/Himayasree"
  },
  {
    name: "K Venkata Teja",
    role: "Web Master",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/in/venkata-teja-kurra-16792b342?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    
  },
  {
    name: "B Satish",
    role: "Treasurer",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/in/sathish-batthula/",
    
  },
  {
    name: "K Keerthi",
    role: "Member",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/in/kalla-keerthi?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    github: "https://github.com/kallakeerthiyadav"
  },
  {
    name: "Y Sai Priyanka",
    role: "Member",
    chapter: "IEEE CS",
    linkedin: "https://www.linkedin.com/in/sai-priyanka-2710032b6/",
    github: "https://github.com/saipriyanka1306"
  }
];
