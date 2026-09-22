import axios from "axios";
import { env } from "../config/env.js";

const API_URL = env.API_URL || "http://localhost:5000";
const ADMIN_TOKEN = "YOUR_ADMIN_JWT_TOKEN_HERE"; // You'll need to set this

async function testRegistrationsAPI() {
  try {
    console.log("🔍 Testing /admin/registrations/search endpoint\n");
    console.log(`API URL: ${API_URL}`);
    console.log(`Searching for: paymentStatus=success\n`);

    const response = await axios.get(`${API_URL}/admin/registrations/search`, {
      params: {
        paymentStatus: "success",
        limit: 50
      },
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    console.log(`✅ API Response received`);
    console.log(`📊 Total teams found: ${response.data.rows.length}\n`);

    // Show team names
    console.log("📋 Teams with status='success':");
    response.data.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.teamName} - Payment: ${row.paymentStatus}`);
    });

    // Check for the teams we're looking for
    const targetTeams = ["HACKX", "CodeVision", "Tech Titans", "Apexcode", "Apex", "Code Catalysts"];
    const foundTeams = response.data.rows.filter(row =>
      targetTeams.some(target => row.teamName.toUpperCase().includes(target.toUpperCase()))
    );

    console.log(`\n✅ Teams from your list found in API response: ${foundTeams.length}`);
    foundTeams.forEach(team => {
      console.log(`   ✅ ${team.teamName}`);
    });

    const missingTeams = targetTeams.filter(target =>
      !response.data.rows.some(row => row.teamName.toUpperCase().includes(target.toUpperCase()))
    );

    if (missingTeams.length > 0) {
      console.log(`\n❌ Teams NOT appearing in API response:`);
      missingTeams.forEach(team => {
        console.log(`   ❌ ${team}`);
      });
    }

  } catch (error) {
    console.error("❌ API Error:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
  }
}

testRegistrationsAPI();
