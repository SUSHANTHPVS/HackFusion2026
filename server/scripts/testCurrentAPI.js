import axios from 'axios';

async function testCurrentAPI() {
  try {
    console.log("🧪 Testing current Registrations API output\n");

    const response = await axios.get('http://localhost:8080/admin/registrations/search', {
      params: { paymentStatus: 'success' },
      headers: {
        'Authorization': 'Bearer test'
      }
    });

    console.log(`✅ API Response received: ${response.data.data.length} teams\n`);
    
    const targetTeams = ['HACKX', 'CodeVision', 'Tech Titans', 'Apexcode', 'Apex', 'Code Catalysts', 'Team errors'];
    
    console.log("📋 Checking target teams in API response:\n");
    targetTeams.forEach(teamName => {
      const found = response.data.data.find(team => 
        team.name.toUpperCase().includes(teamName.toUpperCase())
      );
      
      if (found) {
        console.log(`✅ ${teamName.padEnd(20)} - FOUND in API response`);
      } else {
        console.log(`❌ ${teamName.padEnd(20)} - NOT in API response`);
      }
    });

    console.log("\n🔍 All teams in API response:");
    response.data.data.slice(0, 10).forEach(team => {
      console.log(`   - ${team.name}`);
    });
    
    if (response.data.data.length > 10) {
      console.log(`   ... and ${response.data.data.length - 10} more`);
    }

  } catch (error) {
    console.error("❌ Error:", error.response?.status, error.response?.data || error.message);
  }
}

testCurrentAPI();
