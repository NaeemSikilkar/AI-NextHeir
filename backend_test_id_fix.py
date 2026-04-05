import requests
import sys
import json
import uuid
from datetime import datetime

class IDPreservationTester:
    def __init__(self, base_url="https://heir-planner.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.scenario_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
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

    def test_login_admin(self):
        """Login as admin for testing"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@nextheir.com", "password": "Admin123!"}
        )
        return success

    def test_id_preservation_scenario_creation(self):
        """Test that frontend-generated IDs are preserved in backend"""
        # Generate specific UUIDs that we can track
        asset_id_1 = str(uuid.uuid4())
        asset_id_2 = str(uuid.uuid4())
        member_id_1 = str(uuid.uuid4())
        member_id_2 = str(uuid.uuid4())
        
        print(f"   Generated Asset IDs: {asset_id_1}, {asset_id_2}")
        print(f"   Generated Member IDs: {member_id_1}, {member_id_2}")
        
        scenario_data = {
            "name": "ID Preservation Test Scenario",
            "assets": [
                {
                    "id": asset_id_1,
                    "asset_type": "Property",
                    "asset_name": "Test House",
                    "purchased_year": 2020,
                    "purchase_price": 500000,
                    "current_value": 600000,
                    "ownership_percent": 100,
                    "appreciation_percent": 20
                },
                {
                    "id": asset_id_2,
                    "asset_type": "Business",
                    "asset_name": "Test Business",
                    "purchased_year": 2018,
                    "purchase_price": 200000,
                    "current_value": 300000,
                    "ownership_percent": 80,
                    "appreciation_percent": 50
                }
            ],
            "family_members": [
                {
                    "id": member_id_1,
                    "name": "Alice Test",
                    "relationship": "Daughter",
                    "age": 25,
                    "profession": "Engineer",
                    "description": "Test daughter"
                },
                {
                    "id": member_id_2,
                    "name": "Bob Test",
                    "relationship": "Son",
                    "age": 30,
                    "profession": "Doctor",
                    "description": "Test son"
                }
            ],
            "allocations": [
                {
                    "asset_id": asset_id_1,
                    "distributions": {
                        member_id_1: 60.0,
                        member_id_2: 40.0
                    }
                },
                {
                    "asset_id": asset_id_2,
                    "distributions": {
                        member_id_1: 30.0,
                        member_id_2: 70.0
                    }
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Scenario with Specific IDs",
            "POST",
            "scenarios",
            201,
            data=scenario_data
        )
        
        if success:
            self.scenario_id = response.get('id')
            print(f"   Created scenario ID: {self.scenario_id}")
            
            # Verify IDs are preserved
            returned_assets = response.get('assets', [])
            returned_members = response.get('family_members', [])
            returned_allocations = response.get('allocations', [])
            
            # Check asset IDs
            asset_ids_preserved = True
            for asset in returned_assets:
                if asset['id'] not in [asset_id_1, asset_id_2]:
                    asset_ids_preserved = False
                    print(f"   ❌ Asset ID not preserved: expected {asset_id_1} or {asset_id_2}, got {asset['id']}")
            
            # Check member IDs
            member_ids_preserved = True
            for member in returned_members:
                if member['id'] not in [member_id_1, member_id_2]:
                    member_ids_preserved = False
                    print(f"   ❌ Member ID not preserved: expected {member_id_1} or {member_id_2}, got {member['id']}")
            
            # Check allocation references
            allocation_refs_valid = True
            for alloc in returned_allocations:
                if alloc['asset_id'] not in [asset_id_1, asset_id_2]:
                    allocation_refs_valid = False
                    print(f"   ❌ Allocation asset_id invalid: {alloc['asset_id']}")
                for member_id in alloc['distributions'].keys():
                    if member_id not in [member_id_1, member_id_2]:
                        allocation_refs_valid = False
                        print(f"   ❌ Allocation member_id invalid: {member_id}")
            
            if asset_ids_preserved and member_ids_preserved and allocation_refs_valid:
                print("   ✅ All IDs preserved correctly")
                return True
            else:
                print("   ❌ ID preservation failed")
                return False
        
        return success

    def test_simulation_non_zero_distribution(self):
        """Test that simulation produces non-zero distribution percentages"""
        if not self.scenario_id:
            print("❌ No scenario ID available for simulation")
            return False
            
        success, response = self.run_test(
            "Run Simulation - Check Non-Zero Distribution",
            "POST",
            f"scenarios/{self.scenario_id}/simulate",
            200
        )
        
        if success:
            distribution = response.get('distribution', [])
            total_estate_value = response.get('total_estate_value', 0)
            fairness_score = response.get('fairness_score', 0)
            
            print(f"   Total Estate Value: {total_estate_value}")
            print(f"   Fairness Score: {fairness_score}")
            
            # Check that all members have non-zero percentages
            all_non_zero = True
            total_percentage = 0
            
            for member_dist in distribution:
                percentage = member_dist.get('percentage_of_total', 0)
                total_value = member_dist.get('total_value', 0)
                name = member_dist.get('name', 'Unknown')
                
                print(f"   {name}: {percentage}% ({total_value})")
                
                if percentage <= 0:
                    all_non_zero = False
                    print(f"   ❌ {name} has zero or negative percentage: {percentage}%")
                
                total_percentage += percentage
            
            # Check that percentages sum to approximately 100%
            if abs(total_percentage - 100) > 0.1:
                print(f"   ❌ Total percentage doesn't sum to 100%: {total_percentage}%")
                all_non_zero = False
            else:
                print(f"   ✅ Total percentage sums correctly: {total_percentage}%")
            
            if all_non_zero:
                print("   ✅ All members have non-zero distribution percentages")
                return True
            else:
                print("   ❌ Some members have zero distribution percentages")
                return False
        
        return success

    def test_edge_case_zero_purchase_price(self):
        """Test edge case where asset has 0 purchase price"""
        # Generate specific UUIDs
        asset_id = str(uuid.uuid4())
        member_id = str(uuid.uuid4())
        
        scenario_data = {
            "name": "Zero Purchase Price Test",
            "assets": [
                {
                    "id": asset_id,
                    "asset_type": "Property",
                    "asset_name": "Inherited Property",
                    "purchased_year": 2020,
                    "purchase_price": 0,  # Zero purchase price
                    "current_value": 500000,
                    "ownership_percent": 100,
                    "appreciation_percent": 0
                }
            ],
            "family_members": [
                {
                    "id": member_id,
                    "name": "Test Heir",
                    "relationship": "Son",
                    "age": 30,
                    "profession": "Engineer",
                    "description": "Test heir"
                }
            ],
            "allocations": [
                {
                    "asset_id": asset_id,
                    "distributions": {
                        member_id: 100.0
                    }
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Scenario with Zero Purchase Price",
            "POST",
            "scenarios",
            201,
            data=scenario_data
        )
        
        if success:
            scenario_id = response.get('id')
            
            # Try to run simulation
            sim_success, sim_response = self.run_test(
                "Simulate Zero Purchase Price Scenario",
                "POST",
                f"scenarios/{scenario_id}/simulate",
                200
            )
            
            if sim_success:
                distribution = sim_response.get('distribution', [])
                if distribution and len(distribution) > 0:
                    percentage = distribution[0].get('percentage_of_total', 0)
                    if percentage > 0:
                        print(f"   ✅ Zero purchase price handled correctly: {percentage}%")
                        return True
                    else:
                        print(f"   ❌ Zero purchase price resulted in 0% distribution")
                        return False
                else:
                    print("   ❌ No distribution data returned")
                    return False
            else:
                print("   ❌ Simulation failed with zero purchase price")
                return False
        
        return success

def main():
    print("🚀 Starting ID Preservation and Distribution Fix Testing...")
    tester = IDPreservationTester()
    
    # Login as admin
    if not tester.test_login_admin():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Test ID preservation
    if not tester.test_id_preservation_scenario_creation():
        print("❌ ID preservation test failed")
        return 1
    
    # Test simulation produces non-zero distribution
    if not tester.test_simulation_non_zero_distribution():
        print("❌ Non-zero distribution test failed")
        return 1
    
    # Test edge case with zero purchase price
    if not tester.test_edge_case_zero_purchase_price():
        print("❌ Zero purchase price edge case test failed")
        return 1
    
    # Print final results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All ID preservation and distribution tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())