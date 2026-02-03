const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const API_URL = "http://127.0.0.1:5000/api";

async function run() {
  try {
    // 1. Ensure Patient Exists
    const patEmail = "tahmid12955@gmail.com";
    const password = "password123";
    
    // Try login first
    let res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: patEmail, password })
    });
    
    if (res.status === 401) {
        console.log("Login failed, registering/resetting...");
        // Register if not exists (simple cheat: use my existing setup script logic or just register)
        const regRes = await fetch(`${API_URL}/auth/register`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({
                email: patEmail, password, full_name: "Test Patient", role: "patient",
                phone: "123", address: "Test", date_of_birth: "2000-01-01", gender: "Other"
             })
        });
        
        // If register fails (e.g. user exists but wrong password), we might need manual fix, 
        // but for now assume register works or we are stuck.
        // Actually, let's just use the `setup_test_data.js` logic approach?
        // No, let's retry login after register.
        
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: patEmail, password })
        });
    }

    const data = await res.json();
    if (!res.ok) throw new Error("Login/Setup failed: " + JSON.stringify(data));
    const { token, user } = data;
    console.log("Logged in as patient:", user.user_id);

    // 2. Fetch Prescriptions
    console.log("Fetching prescriptions...");
    const rxRes = await fetch(`${API_URL}/prescriptions/patient/${user.user_id}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const rxList = await rxRes.json();
    
    if (!rxRes.ok) throw new Error("Fetch failed: " + JSON.stringify(rxList));
    
    console.log("✅ Success! Found", rxList.length, "medications.");
    if (rxList.length > 0) {
        console.log("Sample:", rxList[0]);
    } else {
        console.log("No prescriptions found (Expected if none created yet).");
    }

  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
