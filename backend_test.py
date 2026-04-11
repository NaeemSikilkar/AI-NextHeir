import requests
import sys
import json
import uuid
from datetime import datetime

class NextHeirAPITester:
    def __init__(self, base_url="https://heir-planner.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()  # Use session to handle cookies
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.scenario_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_fresh_user(self):
        """Register a fresh test user"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testuser{timestamp}@test.com"
        test_password = "Test123!"
        
        success, response = self.run_test(
            "Register Fresh User",
            "POST",
            "auth/register",
            200,
            data={
                "name": f"Test User {timestamp}",
                "email": test_email,
                "password": test_password
            }
        )
        if success:
            self.user_id = response.get('id')
            print(f"   Registered user: {test_email}")
            return test_email, test_password
        return None, None

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success:
            # Token should be in httpOnly cookie, but we'll try to get it from response
            self.user_id = response.get('id')
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_scenario_with_ids(self):
        """Create a scenario with specific IDs to test ID preservation"""
        asset_id_1 = str(uuid.uuid4())
        asset_id_2 = str(uuid.uuid4())
        member_id_1 = str(uuid.uuid4())
        member_id_2 = str(uuid.uuid4())
        
        scenario_data = {
            "name": "Test Scenario - ID Preservation",
            "assets": [
                {
                    "id": asset_id_1,
                    "asset_type": "Property",
                    "asset_name": "Family Home",
                    "purchased_year": 2010,
                    "purchase_price": 500000,
                    "current_value": 800000,
                    "ownership_percent": 100,
                    "appreciation_percent": 60
                },
                {
                    "id": asset_id_2,
                    "asset_type": "Business",
                    "asset_name": "Tech Startup",
                    "purchased_year": 2015,
                    "purchase_price": 100000,
                    "current_value": 300000,
                    "ownership_percent": 75,
                    "appreciation_percent": 200
                }
            ],
            "family_members": [
                {
                    "id": member_id_1,
                    "name": "Alice Johnson",
                    "relationship": "Daughter",
                    "age": 28,
                    "profession": "Doctor",
                    "description": "Eldest daughter, responsible and caring"
                },
                {
                    "id": member_id_2,
                    "name": "Bob Johnson",
                    "relationship": "Son",
                    "age": 25,
                    "profession": "Engineer",
                    "description": "Youngest son, innovative and ambitious"
                }
            ],
            "allocations": [
                {
                    "asset_id": asset_id_1,
                    "distributions": {
                        member_id_1: 60,
                        member_id_2: 40
                    }
                },
                {
                    "asset_id": asset_id_2,
                    "distributions": {
                        member_id_1: 40,
                        member_id_2: 60
                    }
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Scenario with IDs",
            "POST",
            "scenarios",
            201,
            data=scenario_data
        )
        
        if success:
            scenario_id = response.get('id')
            self.scenario_ids.append(scenario_id)
            
            # Verify IDs are preserved
            print(f"   Verifying ID preservation...")
            print(f"   Asset 1 ID: {asset_id_1} -> {response['assets'][0]['id']}")
            print(f"   Asset 2 ID: {asset_id_2} -> {response['assets'][1]['id']}")
            print(f"   Member 1 ID: {member_id_1} -> {response['family_members'][0]['id']}")
            print(f"   Member 2 ID: {member_id_2} -> {response['family_members'][1]['id']}")
            
            ids_preserved = (
                response['assets'][0]['id'] == asset_id_1 and
                response['assets'][1]['id'] == asset_id_2 and
                response['family_members'][0]['id'] == member_id_1 and
                response['family_members'][1]['id'] == member_id_2
            )
            
            if ids_preserved:
                print(f"   ✅ IDs preserved correctly")
            else:
                print(f"   ❌ IDs not preserved")
                
            return scenario_id
        return None

    def test_run_simulation(self, scenario_id):
        """Test running simulation on a scenario"""
        success, response = self.run_test(
            "Run Simulation",
            "POST",
            f"scenarios/{scenario_id}/simulate",
            200
        )
        
        if success:
            # Verify simulation results
            total_value = response.get('total_estate_value', 0)
            distribution = response.get('distribution', [])
            fairness_score = response.get('fairness_score', 0)
            
            print(f"   Total Estate Value: {total_value}")
            print(f"   Fairness Score: {fairness_score}")
            print(f"   Distribution:")
            
            total_percentage = 0
            for d in distribution:
                print(f"     {d['name']}: {d['percentage_of_total']}% ({d['total_value']})")
                total_percentage += d['percentage_of_total']
            
            print(f"   Total Percentage: {total_percentage}%")
            
            # Verify non-zero distribution
            has_non_zero = any(d['percentage_of_total'] > 0 for d in distribution)
            if has_non_zero:
                print(f"   ✅ Non-zero distribution percentages found")
            else:
                print(f"   ❌ All distribution percentages are zero")
                
            return response
        return None

    def test_get_scenario(self, scenario_id):
        """Test getting a scenario by ID"""
        success, response = self.run_test(
            "Get Scenario",
            "GET",
            f"scenarios/{scenario_id}",
            200
        )
        return success, response

    def test_list_scenarios(self):
        """Test listing all scenarios"""
        success, response = self.run_test(
            "List Scenarios",
            "GET",
            "scenarios",
            200
        )
        if success:
            print(f"   Found {len(response)} scenarios")
        return success, response

    def test_update_scenario(self, scenario_id):
        """Test updating a scenario"""
        update_data = {
            "name": "Updated Test Scenario"
        }
        
        success, response = self.run_test(
            "Update Scenario",
            "PUT",
            f"scenarios/{scenario_id}",
            200,
            data=update_data
        )
        
        if success and response.get('name') == "Updated Test Scenario":
            print(f"   ✅ Scenario name updated successfully")
        return success

    def test_ai_chat(self, scenario_id):
        """Test AI chat functionality"""
        chat_data = {
            "message": "Is this distribution fair?",
            "scenario_id": scenario_id
        }
        
        success, response = self.run_test(
            "AI Chat",
            "POST",
            "chat",
            200,
            data=chat_data
        )
        
        if success:
            ai_response = response.get('response', '')
            session_id = response.get('session_id', '')
            print(f"   AI Response length: {len(ai_response)} characters")
            print(f"   Session ID: {session_id}")
            if ai_response and session_id:
                print(f"   ✅ AI chat working correctly")
                return session_id
        return None

    def test_edge_case_single_asset_member(self):
        """Test edge case: single asset and single member (100% allocation)"""
        asset_id = str(uuid.uuid4())
        member_id = str(uuid.uuid4())
        
        scenario_data = {
            "name": "Edge Case - Single Asset/Member",
            "assets": [
                {
                    "id": asset_id,
                    "asset_type": "Property",
                    "asset_name": "Solo Property",
                    "purchased_year": 2020,
                    "purchase_price": 200000,
                    "current_value": 250000,
                    "ownership_percent": 100,
                    "appreciation_percent": 25
                }
            ],
            "family_members": [
                {
                    "id": member_id,
                    "name": "Solo Heir",
                    "relationship": "Son",
                    "age": 30,
                    "profession": "Teacher",
                    "description": "Only child"
                }
            ],
            "allocations": [
                {
                    "asset_id": asset_id,
                    "distributions": {
                        member_id: 100
                    }
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Edge Case Scenario",
            "POST",
            "scenarios",
            201,
            data=scenario_data
        )
        
        if success:
            scenario_id = response.get('id')
            self.scenario_ids.append(scenario_id)
            
            # Run simulation
            sim_success, sim_response = self.run_test(
                "Simulate Edge Case",
                "POST",
                f"scenarios/{scenario_id}/simulate",
                200
            )
            
            if sim_success:
                distribution = sim_response.get('distribution', [])
                if len(distribution) == 1 and distribution[0]['percentage_of_total'] == 100:
                    print(f"   ✅ Edge case handled correctly: 100% to single heir")
                    return scenario_id
                    
        return None

    def test_duplicate_scenario(self, scenario_id):
        """Test duplicating a scenario"""
        success, response = self.run_test(
            "Duplicate Scenario",
            "POST",
            f"scenarios/{scenario_id}/duplicate",
            201
        )
        
        if success:
            new_scenario_id = response.get('id')
            new_name = response.get('name')
            print(f"   Duplicated scenario ID: {new_scenario_id}")
            print(f"   New scenario name: {new_name}")
            
            if new_scenario_id and "(Copy)" in new_name:
                print(f"   ✅ Scenario duplicated successfully")
                self.scenario_ids.append(new_scenario_id)
                return new_scenario_id
            else:
                print(f"   ❌ Duplicate scenario response invalid")
        return None

    def test_compare_scenarios(self):
        """Test compare scenarios functionality"""
        if len(self.scenario_ids) >= 2:
            compare_data = {
                "message": "Which scenario is better?",
                "scenario_a_id": self.scenario_ids[0],
                "scenario_b_id": self.scenario_ids[1]
            }
            
            success, response = self.run_test(
                "Compare Scenarios Chat",
                "POST",
                "chat/compare",
                200,
                data=compare_data
            )
            
            if success:
                ai_response = response.get('response', '')
                print(f"   Compare AI Response length: {len(ai_response)} characters")
                return True
        else:
            print(f"   ⚠️  Need at least 2 scenarios to test comparison")
        return False

    def test_delete_scenario(self, scenario_id):
        """Test deleting a scenario"""
        success, response = self.run_test(
            "Delete Scenario",
            "DELETE",
            f"scenarios/{scenario_id}",
            200
        )
        return success

    def test_logout(self):
        """Test logout"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        if success:
            self.session.cookies.clear()
        return success

def main():
    print("🚀 Starting NextHeir API Testing - Iteration 4")
    print("=" * 60)
    
    tester = NextHeirAPITester()
    
    # Test 1: Register fresh user
    email, password = tester.test_register_fresh_user()
    if not email:
        print("❌ Registration failed, stopping tests")
        return 1

    # Test 2: Login
    if not tester.test_login(email, password):
        print("❌ Login failed, stopping tests")
        return 1

    # Test 3: Auth me
    if not tester.test_auth_me():
        print("❌ Auth me failed")

    # Test 4: Create scenario with ID preservation
    scenario_id_1 = tester.test_create_scenario_with_ids()
    if not scenario_id_1:
        print("❌ Scenario creation failed, stopping tests")
        return 1

    # Test 5: Run simulation
    simulation_result = tester.test_run_simulation(scenario_id_1)
    if not simulation_result:
        print("❌ Simulation failed")

    # Test 6: Get scenario
    success, scenario_data = tester.test_get_scenario(scenario_id_1)
    if not success:
        print("❌ Get scenario failed")

    # Test 7: List scenarios
    success, scenarios_list = tester.test_list_scenarios()
    if not success:
        print("❌ List scenarios failed")

    # Test 8: Update scenario
    if not tester.test_update_scenario(scenario_id_1):
        print("❌ Update scenario failed")

    # Test 9: Duplicate scenario
    duplicate_scenario_id = tester.test_duplicate_scenario(scenario_id_1)
    if not duplicate_scenario_id:
        print("❌ Duplicate scenario failed")

    # Test 10: AI Chat
    session_id = tester.test_ai_chat(scenario_id_1)
    if not session_id:
        print("❌ AI Chat failed")

    # Test 11: Edge case - single asset/member
    edge_scenario_id = tester.test_edge_case_single_asset_member()
    if not edge_scenario_id:
        print("❌ Edge case scenario failed")

    # Test 12: Compare scenarios
    if not tester.test_compare_scenarios():
        print("❌ Compare scenarios failed")

    # Test 13: Delete scenarios (cleanup)
    for sid in tester.scenario_ids:
        tester.test_delete_scenario(sid)

    # Test 14: Logout
    if not tester.test_logout():
        print("❌ Logout failed")

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())