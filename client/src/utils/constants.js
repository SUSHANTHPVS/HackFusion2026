export const EVENT_NAME = "IEEE RAS x IEEE CS Hackathon";
export const EVENT_DATE = "2026-09-25T08:00:00+05:30";
export const THEME_REVEAL_DATE = "2026-09-25T06:00:00+05:30";
export const REGISTRATION_CAPACITY = 100;
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

export const BRANCH_OPTIONS = ["CSE", "CSE-DS", "CSE-CS", "AIML", "IT", "ECE", "EEE"];
export const YEAR_OPTIONS = ["3rd year", "4th year"];
export const BRANCH_SECTION_LIMITS = {
  CSE: 20,
  AIML: 15,
  "CSE-DS": 5,
  "CSE-CS": 5,
  IT: 3,
  ECE: 8,
  EEE: 8
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
    role: "Registration Lead",
    chapter: "IEEE RAS",
    linkedin: "https://www.linkedin.com/in/sushanth-p-v-67290a31b/",
    github: "https://github.com/SUSHANTHPVS"
  },
  {
    name: "M Divya",
    role: "Registration Support",
    chapter: "Non IEEE Member",
    linkedin: "https://www.linkedin.com/in/divya-madhanambeti-799aa3423/",
    github: ""
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

export const GUEST_SPEAKERS = [
  {
    name: "Sathyaprabha Gunasekaran",
    role: "Cybersecurity Professional | Security Manager, Fractal Analytics",
    photo: "/guests/sathyaprabha-gunasekaran.jpg",
    companyName: "Fractal Analytics",
    companyLogo: "/logos/fractal-logo.png",
    bio: "Cybersecurity professional with 7+ years of experience in cyber defense, incident response, threat intelligence, and SOC operations. Currently serving as Security Manager at Fractal Analytics, she has previously worked with EY GDS and L&T Smart World & Communications. An NCDRC Member and cybersecurity speaker, she actively contributes to cybersecurity awareness through technical sessions, workshops, and industry-focused knowledge sharing.",
    expertise: ["Cyber Defense", "Threat Intelligence", "Incident Response", "SOC", "SIEM", "EDR", "SOAR"],
    highlights: ["🏆 Cybersecurity Champion of the Year – 2026"],
    linkedin: "https://www.linkedin.com/in/sathyaprabha-gunasekaran-cybersecurityprofessional-speaker/"
  },
  {
    name: "N. Naresh Kumar",
    role: "Senior Manager – Project & Program Management | L&T Infotech",
    photo: "/guests/naresh-kumar.jpg",
    companyName: "L&T Infotech",
    companyLogo: "/logos/ltm-logo.png",
    bio: "Accomplished Project & Program Management professional with 15+ years of experience in enterprise IT, technology operations, Agile delivery, DevOps, and service management. Currently serving as Senior Manager – Project & Program Management at L&T Infotech, he has led large cross-functional teams and enterprise-scale technology initiatives, with extensive experience in CitiBank projects, stakeholder management, vendor coordination, SLA/KPI management, risk management, and strategic delivery.",
    expertise: ["Project & Program Management", "Agile & Scrum", "DevOps", "IT Service Management", "Stakeholder Management", "Risk & Vendor Management", "Enterprise Operations"],
    highlights: ["🎓 MBA – Operations Management, Anna University", "🏢 15+ Years of Industry Experience", "💼 Enterprise Technology & Banking Experience"],
    linkedin: "https://www.linkedin.com/in/naresh-kumar-cism-9a475838/"
  }
];
