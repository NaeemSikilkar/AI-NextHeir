import requests
import sys
import json
from datetime import datetime

class NextHeirAPITester:
    def __init__(self, base_url="https://heir-planner.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.scenario_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, cookies=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            elif method == 'PUT':
                response = self.session.put(url, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        test_user_data = {
            "name": "Test User",
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "Test123!"
        }
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        if success:
            self.user_id = response.get('id')
            print(f"   Registered user ID: {self.user_id}")
        return success, test_user_data

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success:
            print(f"   Logged in user: {response.get('email')}")
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@nextheir.com", "password": "Admin123!"}
        )
        return success

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_scenario(self):
        """Test scenario creation"""
        scenario_data = {
            "name": "Test Inheritance Scenario",
            "assets": [
                {
                    "asset_type": "Property",
                    "asset_name": "Family Home",
                    "purchased_year": 2000,
                    "purchase_price": 500000,
                    "current_value": 800000,
                    "ownership_percent": 100,
                    "appreciation_percent": 3
                }
            ],
            "family_members": [
                {
                    "name": "John Doe",
                    "relationship": "Son",
                    "age": 30,
                    "profession": "Engineer",
                    "description": "Eldest son, responsible and stable"
                },
                {
                    "name": "Jane Doe",
                    "relationship": "Daughter",
                    "age": 28,
                    "profession": "Doctor",
                    "description": "Youngest daughter, caring and ambitious"
                }
            ],
            "allocations": []
        }
        
        # We need to set allocations after we have asset and member IDs
        # For now, we'll create the scenario and update it
        success, response = self.run_test(
            "Create Scenario",
            "POST",
            "scenarios",
            200,
            data=scenario_data
        )
        if success:
            self.scenario_id = response.get('id')
            print(f"   Created scenario ID: {self.scenario_id}")
            
            # Now update with proper allocations
            assets = response.get('assets', [])
            members = response.get('family_members', [])
            
            if assets and members:
                allocations = [{
                    "asset_id": assets[0]['id'],
                    "distributions": {
                        members[0]['id']: 60.0,  # John gets 60%
                        members[1]['id']: 40.0   # Jane gets 40%
                    }
                }]
                
                scenario_data['allocations'] = allocations
                update_success, _ = self.run_test(
                    "Update Scenario with Allocations",
                    "PUT",
                    f"scenarios/{self.scenario_id}",
                    200,
                    data=scenario_data
                )
                return update_success
        return success

    def test_list_scenarios(self):
        """Test listing scenarios"""
        success, response = self.run_test(
            "List Scenarios",
            "GET",
            "scenarios",
            200
        )
        if success:
            print(f"   Found {len(response)} scenarios")
        return success

    def test_get_scenario(self):
        """Test getting specific scenario"""
        if not self.scenario_id:
            print("❌ No scenario ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Scenario",
            "GET",
            f"scenarios/{self.scenario_id}",
            200
        )
        return success

    def test_run_simulation(self):
        """Test running simulation"""
        if not self.scenario_id:
            print("❌ No scenario ID available for simulation")
            return False
            
        success, response = self.run_test(
            "Run Simulation",
            "POST",
            f"scenarios/{self.scenario_id}/simulate",
            200
        )
        if success:
            fairness_score = response.get('fairness_score', 'N/A')
            total_value = response.get('total_estate_value', 'N/A')
            print(f"   Fairness Score: {fairness_score}")
            print(f"   Total Estate Value: {total_value}")
        return success

    def test_ai_chat(self):
        """Test AI chat functionality"""
        if not self.scenario_id:
            print("❌ No scenario ID available for chat")
            return False
            
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "chat",
            200,
            data={
                "message": "Is this distribution fair?",
                "scenario_id": self.scenario_id
            }
        )
        if success:
            ai_response = response.get('response', '')
            print(f"   AI Response length: {len(ai_response)} characters")
        return success

    def test_compare_chat(self):
        """Test compare scenarios chat"""
        if not self.scenario_id:
            print("❌ No scenario ID available for compare chat")
            return False
            
        # Use same scenario for both A and B for testing
        success, response = self.run_test(
            "Compare Scenarios Chat",
            "POST",
            "chat/compare",
            200,
            data={
                "message": "Which scenario is better?",
                "scenario_a_id": self.scenario_id,
                "scenario_b_id": self.scenario_id
            }
        )
        if success:
            ai_response = response.get('response', '')
            print(f"   Compare AI Response length: {len(ai_response)} characters")
        return success

    def test_logout(self):
        """Test user logout"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

def main():
    print("🚀 Starting NextHeir API Testing...")
    tester = NextHeirAPITester()
    
    # Test registration and login flow
    reg_success, user_data = tester.test_register()
    if not reg_success:
        print("❌ Registration failed, stopping tests")
        return 1

    # Test admin login
    admin_success = tester.test_admin_login()
    if not admin_success:
        print("⚠️ Admin login failed")

    # Test login with registered user
    login_success = tester.test_login(user_data['email'], user_data['password'])
    if not login_success:
        print("❌ Login failed, stopping tests")
        return 1

    # Test authenticated endpoints
    tester.test_get_me()
    
    # Test scenario management
    scenario_success = tester.test_create_scenario()
    if scenario_success:
        tester.test_list_scenarios()
        tester.test_get_scenario()
        tester.test_run_simulation()
        
        # Test AI features
        tester.test_ai_chat()
        tester.test_compare_chat()

    # Test logout
    tester.test_logout()

    # Print final results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())